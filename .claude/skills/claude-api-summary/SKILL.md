---
name: claude-api-summary
description: Cómo llamar a la API de Claude (Anthropic) para resumir el texto ya transcripto de una entrevista. Usar al implementar la Parte C del módulo de entrevistas o cualquier feature que mande texto del usuario a la API de Claude.
---

# Resumen de entrevistas vía API de Claude

Regla (`confidentiality-guard`): **solo se manda texto** — el texto transcripto que el usuario ya revisó y anonimizó en el textarea. Nunca audio, nunca imágenes con identificación.

## Dónde corre

En una **Server Action** o Route Handler server-side. La API key (`ANTHROPIC_API_KEY`) vive en `.env.local` / variables de entorno de Vercel — **nunca** en el cliente, nunca commiteada.

## Dependencia

```
npm i @anthropic-ai/sdk
```

## Modelo

`claude-sonnet-5` para calidad de resumen. Si el volumen crece y el costo importa, `claude-haiku-4-5-20251001`. Consultar la skill `claude-api` para ids y precios vigentes antes de fijar el modelo.

## Prompt fijo (no dejar que el usuario lo edite libremente)

```ts
const SYSTEM = `Sos un asistente que resume entrevistas de una Práctica Profesional
Supervisada de Administración de Empresas. Recibís una transcripción ya anonimizada.
Devolvés SIEMPRE este formato, en español rioplatense neutro:

## Resumen ejecutivo
(3 a 5 líneas)

## Tareas mencionadas por el entrevistado
- ...

## Fricciones o problemas mencionados
- ...

## Citas textuales candidatas
(2 a 3 citas breves, marcadas como "candidata", no como definitivas)

No inventes datos que no estén en la transcripción. No agregues nombres propios.`;
```

## Llamada

```ts
"use server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno

export async function generarResumen(transcripcion: string) {
  if (!transcripcion?.trim()) throw new Error("Transcripción vacía");

  const msg = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1500,
    system: SYSTEM,
    messages: [{ role: "user", content: transcripcion }],
  });

  const texto = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");

  return texto; // se guarda en entrevistas.resumen; los temas -> entrevistas.temas_detectados (jsonb)
}
```

## Guardas

- [ ] `content` del mensaje = solo `transcripcion` (string). Nunca un objeto con rutas de archivo, base64 de audio, ni imágenes.
- [ ] La key nunca aparece en el bundle del cliente (`grep -rn "ANTHROPIC_API_KEY" src` solo en archivos server).
- [ ] Manejar error/timeout de la API sin romper la vista.
- [ ] El resultado es asistencia, no verdad final: la UI lo muestra como borrador editable.

Ver también la skill `claude-api` para streaming, prompt caching y token counting si hacen falta.
