import { GoogleGenAI, Type } from '@google/genai';
import { createSquareBooking } from './squareClient.js';
import { VALID_SERVICES, validateBookingInput } from './bookingValidation.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const MAX_TOOL_ITERATIONS = 4;
const FALLBACK_REPLY = "Sorry, something went wrong on our end — could you say that again?";

const SYSTEM_PROMPT = `You are the AI receptionist for Premium Cuts Barbershop, chatting with customers on the shop's website.

Your job is to help each customer book an appointment by collecting five things, conversationally and one or two at a time — never demand all of them in a single interrogation-style message:
1. Their name
2. Their phone number
3. The service they want: Haircut, Beard Trim, or Both
4. Their preferred date
5. Their preferred time

Be warm, polite, and professional — like a great in-person receptionist, not a form. Once you have all five details and the customer has confirmed them, call the book_appointment function to save the booking. Only call it once, and only after the customer has clearly confirmed the details are correct. After the function succeeds, confirm the appointment back to the customer in a friendly closing message.

If a customer asks something unrelated to booking an appointment, gently steer the conversation back to scheduling their visit. Keep replies concise — this is a text chat, not an email.`;

const bookAppointmentDeclaration = {
  name: 'book_appointment',
  description:
    'Saves a completed appointment booking once the customer has provided and confirmed their name, phone number, desired service, date, and time. Only call this after the customer has confirmed all five details are correct.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "The customer's full name." },
      phone: { type: Type.STRING, description: "The customer's phone number." },
      service: {
        type: Type.STRING,
        description: 'The requested service.',
        enum: VALID_SERVICES,
      },
      date: { type: Type.STRING, description: 'The appointment date, as confirmed with the customer.' },
      time: { type: Type.STRING, description: 'The appointment time, as confirmed with the customer.' },
    },
    required: ['name', 'phone', 'service', 'date', 'time'],
  },
};

async function bookAppointmentHandler(args = {}) {
  const { name, phone, service, date, time } = args;

  const validation = validateBookingInput(args);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    return await createSquareBooking({ name, phone, service, date, time });
  } catch (err) {
    console.error('Failed to save booking to Square:', err);
    return { success: false, error: 'The booking could not be saved. Please try again.' };
  }
}

export function createChatAgent({ apiKey }) {
  const ai = new GoogleGenAI({ apiKey });

  /**
   * Runs one turn of the conversation: appends the customer's message to
   * the Gemini `contents` history, executes book_appointment if it's
   * called, feeds the result back, and returns the final reply plus the
   * updated history (the caller persists and resends this on the next
   * turn — there is no server-side session store).
   */
  async function handleMessage(message, history) {
    const contents = Array.isArray(history) ? [...history] : [];
    contents.push({ role: 'user', parts: [{ text: message }] });

    let finalText = '';

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations: [bookAppointmentDeclaration] }],
        },
      });

      const candidateParts = response.candidates?.[0]?.content?.parts || [];
      contents.push({ role: 'model', parts: candidateParts });

      const functionCalls = candidateParts.filter((part) => part.functionCall).map((part) => part.functionCall);
      const textParts = candidateParts.filter((part) => part.text);
      finalText = textParts.map((part) => part.text).join('\n').trim();

      if (functionCalls.length === 0) {
        break;
      }

      const responseParts = [];
      for (const call of functionCalls) {
        const result =
          call.name === 'book_appointment'
            ? await bookAppointmentHandler(call.args)
            : { success: false, error: `Unknown function "${call.name}".` };

        responseParts.push({ functionResponse: { name: call.name, response: result } });
      }

      contents.push({ role: 'user', parts: responseParts });
    }

    return { reply: finalText || FALLBACK_REPLY, history: contents };
  }

  return { handleMessage };
}
