import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const client = new Anthropic();

const RecognitionSchema = z.object({
  is_recognition: z
    .boolean()
    .describe(
      "True only if the author is genuinely thanking, praising, or crediting a teammate for something they did - not a question, complaint, sarcastic remark, or unrelated mention.",
    ),
  reason: z
    .string()
    .nullable()
    .describe(
      "A short (<12 word) paraphrase of what the teammate is being recognized for, or null if is_recognition is false.",
    ),
});

/**
 * Asks Claude whether a Slack message expresses genuine recognition/kudos
 * toward the people it mentions (as opposed to a keyword match like the
 * original Growbot's "props"/"kudos" trigger words).
 */
export async function classifyRecognition(messageText) {
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 1024,
    system:
      "You classify Slack messages for a workplace recognition bot called Growbot. " +
      "Only mark a message as recognition when it sincerely thanks, praises, or credits " +
      "a mentioned teammate. Questions, requests, complaints, and sarcasm are not recognition.",
    messages: [{ role: "user", content: messageText }],
    output_config: {
      format: zodOutputFormat(RecognitionSchema),
    },
  });

  return (
    response.parsed_output ?? { is_recognition: false, reason: null }
  );
}
