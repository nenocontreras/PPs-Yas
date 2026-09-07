import "server-only";

import { MAX_TOKENS } from "../system";
import type { Provider, ProviderId } from "../types";

/**
 * OpenAI y OpenRouter hablan el mismo protocolo (`POST /chat/completions` con
 * `messages: [{role, content}]`). Una sola implementación, dos configs.
 * No mandamos `response_format` porque no todos los modelos de OpenRouter lo
 * soportan; el JSON lo asegura el prompt + `parseResumen`.
 */
function openaiCompat(cfg: {
  id: ProviderId;
  label: string;
  keyEnv: string;
  modelEnv: string;
  defaultModel: string;
  baseUrl: string;
  extraHeaders?: () => Record<string, string>;
}): Provider {
  return {
    id: cfg.id,
    label: cfg.label,
    configured: () => Boolean(process.env[cfg.keyEnv]),
    async complete(system, texto) {
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env[cfg.keyEnv]}`,
          ...cfg.extraHeaders?.(),
        },
        body: JSON.stringify({
          model: process.env[cfg.modelEnv] || cfg.defaultModel,
          max_tokens: MAX_TOKENS,
          temperature: 0.2,
          messages: [
            { role: "system", content: system },
            { role: "user", content: texto },
          ],
        }),
      });
      if (!res.ok) {
        throw new Error(
          `${cfg.label} ${res.status}: ${(await res.text()).slice(0, 300)}`,
        );
      }
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return data.choices?.[0]?.message?.content ?? "";
    },
  };
}

export const openai = openaiCompat({
  id: "openai",
  label: "OpenAI",
  keyEnv: "OPENAI_API_KEY",
  modelEnv: "OPENAI_MODEL",
  defaultModel: "gpt-4o-mini",
  baseUrl: "https://api.openai.com/v1",
});

export const openrouter = openaiCompat({
  id: "openrouter",
  label: "OpenRouter",
  keyEnv: "OPENROUTER_API_KEY",
  modelEnv: "OPENROUTER_MODEL",
  // modelo gratuito por defecto (la idea es no gastar)
  defaultModel: "google/gemini-2.0-flash-exp:free",
  baseUrl: "https://openrouter.ai/api/v1",
  extraHeaders: () => ({
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://localhost",
    "X-Title": "Gestión de PPS",
  }),
});
