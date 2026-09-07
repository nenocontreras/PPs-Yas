import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { MAX_TOKENS } from "../system";
import type { Provider } from "../types";

const DEFAULT_MODEL = "claude-sonnet-5";

/** Claude vía el SDK oficial de Anthropic. */
export const anthropic: Provider = {
  id: "anthropic",
  label: "Claude",
  configured: () => Boolean(process.env.ANTHROPIC_API_KEY),
  async complete(system, texto) {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: texto }],
    });
    return msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  },
};
