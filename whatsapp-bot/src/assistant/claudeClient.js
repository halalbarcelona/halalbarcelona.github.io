import Anthropic from '@anthropic-ai/sdk';
import { tools } from './tools.js';

const MODEL = 'claude-sonnet-5';
const MAX_TOOL_ITERATIONS = 4;
const MAX_HISTORY_MESSAGES = 20;
const FALLBACK_REPLY = 'Lo siento, ha habido un problema. ¿Puedes repetir tu pedido? / Sorry, something went wrong — could you repeat that?';

export function createClaudeClient({ apiKey }) {
  const client = new Anthropic({ apiKey });

  /**
   * Runs one customer turn: sends the message plus conversation history to
   * Claude, executes any tool calls it makes against toolHandlers, feeds the
   * results back, and returns the final natural-language reply. All prices
   * in that reply are guaranteed to have come from a toolHandlers result
   * earlier in the same loop, per the system prompt's rules.
   */
  async function handleMessage({ session, systemPrompt, userMessage, toolHandlers }) {
    const messages = [...session.history, { role: 'user', content: userMessage }];
    let finalText = '';

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        tools,
      });

      messages.push({ role: 'assistant', content: response.content });

      const toolUses = response.content.filter((block) => block.type === 'tool_use');
      const textBlocks = response.content.filter((block) => block.type === 'text');
      finalText = textBlocks.map((b) => b.text).join('\n').trim();

      if (toolUses.length === 0) {
        break;
      }

      const toolResults = [];
      for (const toolUse of toolUses) {
        const handler = toolHandlers[toolUse.name];
        const result = handler
          ? await handler(session, toolUse.input || {})
          : { success: false, error: `Unknown tool "${toolUse.name}".` };

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
          is_error: result?.success === false,
        });
      }

      messages.push({ role: 'user', content: toolResults });
    }

    session.history = messages.slice(-MAX_HISTORY_MESSAGES);
    return finalText || FALLBACK_REPLY;
  }

  return { handleMessage };
}
