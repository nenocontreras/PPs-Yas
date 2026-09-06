import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import type { TemasDetectados } from "./entrevistas";

/**
 * Resumen de entrevistas vía API de Claude (.claude/skills/claude-api-summary).
 * REGLA: solo se manda el texto transcripto que el usuario ya revisó y
 * anonimizó. Nunca audio, nunca imágenes. La API key vive solo en el servidor.
 */

const MODEL = "claude-sonnet-5";

const SYSTEM = `Sos un asistente que resume entrevistas de una Práctica Profesional
Supervisada de la carrera de Administración de Empresas. Recibís una transcripción
que el usuario ya anonimizó (sin nombres propios de personas ni de la empresa).

Devolvés EXCLUSIVAMENTE un objeto JSON válido, sin texto antes ni después, sin
bloque de código, con esta forma exacta:

{
  "resumen_ejecutivo": "3 a 5 oraciones en español rioplatense neutro",
  "tareas": ["tarea o actividad mencionada por el entrevistado", "..."],
  "fricciones": ["problema, traba o queja mencionada", "..."],
  "citas": ["cita textual breve candidata para el informe", "..."]
}

Reglas:
- No inventes datos que no estén en la transcripción.
- No agregues nombres propios ni los reconstruyas.
- "citas": 2 a 3 como máximo, breves y textuales; son CANDIDATAS, no definitivas.
- Si una lista no tiene contenido en la transcripción, devolvela vacía [].`;

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function asStringArray(x: unknown): string[] {
  return Array.isArray(x)
    ? x.filter((i): i is string => typeof i === "string" && i.trim().length > 0)
    : [];
}

function toMarkdown(ejecutivo: string, t: TemasDetectados): string {
  const list = (items: string[]) =>
    items.length ? items.map((i) => `- ${i}`).join("\n") : "- (nada registrado)";
  return [
    "## Resumen ejecutivo",
    ejecutivo.trim() || "(sin resumen)",
    "",
    "## Tareas mencionadas por el entrevistado",
    list(t.tareas),
    "",
    "## Fricciones o problemas mencionados",
    list(t.fricciones),
    "",
    "## Citas textuales candidatas",
    t.citas.length
      ? t.citas.map((c) => `- «${c}» (candidata)`).join("\n")
      : "- (sin citas candidatas)",
  ].join("\n");
}

export async function generarResumen(transcripcion: string): Promise<{
  resumen: string;
  temas: TemasDetectados;
}> {
  const client = new Anthropic();

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: SYSTEM,
    messages: [{ role: "user", content: transcripcion }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripFences(text));
  } catch {
    throw new Error("La API devolvió un formato inesperado. Probá de nuevo.");
  }

  const temas: TemasDetectados = {
    tareas: asStringArray(parsed.tareas),
    fricciones: asStringArray(parsed.fricciones),
    citas: asStringArray(parsed.citas).slice(0, 3),
  };
  const ejecutivo =
    typeof parsed.resumen_ejecutivo === "string" ? parsed.resumen_ejecutivo : "";

  return { resumen: toMarkdown(ejecutivo, temas), temas };
}
