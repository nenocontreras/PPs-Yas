import "server-only";

import { MAX_TOKENS } from "../system";
import type { Provider } from "../types";

const DEFAULT_MODEL = "gemini-2.0-flash";

/**
 * Google Gemini vía REST (`generateContent`). Tiene tier gratuito generoso, así
 * que es el proveedor por defecto. `responseMimeType: application/json` fuerza
 * JSON limpio.
 */
export const gemini: Provider = {
  id: "gemini",
  label: "Gemini",
  configured: () => Boolean(process.env.GEMINI_API_KEY),
  async complete(system, texto) {
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY as string,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: texto }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: MAX_TOKENS,
            responseMimeType: "application/json",
          },
        }),
      },
    );
    if (!res.ok) {
      throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return (
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("") ?? ""
    );
  },
};
