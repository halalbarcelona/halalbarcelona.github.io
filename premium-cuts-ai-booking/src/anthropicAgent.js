import Anthropic from '@anthropic-ai/sdk';
import { insertBooking } from './db.js';

const MODEL = 'claude-sonnet-5';
const MAX_TOOL_ITERATIONS = 4;
const FALLBACK_REPLY = "Sorry, something went wrong on our end — could you say that again?";
const VALID_SERVICES = ['Haircut', 'Beard Trim', 'Both'];

const SYSTEM_PROMPT = `You are the AI receptionist for Premium Cuts Barbershop, chatting with customers on the shop's website.

Your job is to help each customer book an appointment by collecting five things, conversationally and one or two at a time — never demand all of them in a single interrogation-style message:
1. Their name
2. Their phone number
3. The service they want: Haircut, Beard Trim, or Both
4. Their preferred date
5. Their preferred time

Be warm, polite, and professional — like a great in-person receptionist, not a form. Once you have all five details and the customer has confirmed them, call the book_appointment tool to save the booking. Only call it once, and only after the customer has clearly confirmed the details are correct. After the tool succeeds, confirm the appointment back to the customer in a friendly closing message.

If a customer asks something unrelated to booking an appointment, gently steer the conversation back to scheduling their visit. Keep replies concise — this is a text chat, not an email.`;

const tools = [
  {
    name: 'book_appointment',
    description:
      'Saves a completed appointment booking once the customer has provided and confirmed their name, phone number, desired service, date, and time. Only call this after the customer has confirmed all five details are correct.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: "The customer's full name." },
        phone: { type: 'string', description: "The customer's phone number." },
        service: {
          type: 'string',
          enum: VALID_SERVICES,
          description: 'The requested service.',
        },
        date: { type: 'string', description: 'The appointment date, as confirmed with the customer.' },
        time: { type: 'string', description: 'The appointment time, as confirmed with the customer.' },
      },
      required: ['name', 'phone', 'service', 'date', 'time'],
    },
  },
];

async function bookAppointmentHandler(input = {}) {
  const { name, phone, service, date, time } = input;

  if (!name || !phone || !service || !date || !time) {
    return { success: false, error: 'One or more required booking details are missing.' };
  }
  if (!VALID_SERVICES.includes(service)) {
    return { success: false, error: `service must be one of: ${VALID_SERVICES.join(', ')}.` };
  }

  try {
    const { id } = await insertBooking({ name, phone, service, date, time });
    return { success: true, bookingId: id };
  } catch (err) {
    console.error('Failed to save booking:', err);
    return { success: false, error: 'The booking could not be saved. Please try again.' };
  }
}

export function createChatAgent({ apiKey }) {
  const client = new Anthropic({ apiKey });

  /**
   * Runs one turn of the conversation: sends the full message history to
   * Claude, executes book_appointment if it's called, feeds the result
   * back, and returns the final reply plus the updated message history
   * (the caller is expected to persist and resend this history on the
   * next turn — there is no server-side session store).
   */
  async function handleMessage(messages) {
    const working = Array.isArray(messages) ? [...messages] : [];
    let finalText = '';

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: working,
        tools,
      });

      working.push({ role: 'assistant', content: response.content });

      const toolUses = response.content.filter((block) => block.type === 'tool_use');
      const textBlocks = response.content.filter((block) => block.type === 'text');
      finalText = textBlocks.map((b) => b.text).join('\n').trim();

      if (toolUses.length === 0) {
        break;
      }

      const toolResults = [];
      for (const toolUse of toolUses) {
        const result =
          toolUse.name === 'book_appointment'
            ? await bookAppointmentHandler(toolUse.input)
            : { success: false, error: `Unknown tool "${toolUse.name}".` };

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
          is_error: result.success === false,
        });
      }

      working.push({ role: 'user', content: toolResults });
    }

    return { reply: finalText || FALLBACK_REPLY, messages: working };
  }

  return { handleMessage };
}
