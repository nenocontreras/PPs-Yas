import type { TemasDetectados } from "@/lib/entrevistas";

/**
 * Prompt y parsing del resumen de entrevistas. Compartido por todos los
 * proveedores (Gemini / OpenAI / Claude / OpenRouter).
 *
 * REGLA DE CONFIDENCIALIDAD (.claude/skills/confidentiality-guard): a cualquier
 * proveedor se le manda SOLO el texto transcripto que el usuario ya revisó y
 * anonimizó. Nunca audio, nunca imágenes, nunca metadatos de personas.
 */

export const SYSTEM = `Sos un asistente que resume entrevistas de una Práctica Profesional
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

export const MAX_TOKENS = 1500;

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

/** Convierte la respuesta cruda del modelo en `{ resumen, temas }`. */
export function parseResumen(crudo: string): {
  resumen: string;
  temas: TemasDetectados;
} {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripFences(crudo));
  } catch {
    throw new Error("La IA devolvió un formato inesperado.");
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
