---
name: claude-api-summary
description: Cómo se genera el resumen de una entrevista con IA (adaptador multi-proveedor Gemini/OpenAI/Claude/OpenRouter). Usar al tocar `src/lib/resumen/`, el botón "Generar resumen", o cualquier feature que mande texto del usuario a una API de IA.
---

# Resumen de entrevistas vía IA (multi-proveedor)

Regla (`confidentiality-guard`): **solo se manda texto** — la transcripción que el usuario ya revisó y anonimizó en el textarea. Nunca audio, nunca imágenes, nunca metadatos de personas. Vale para **cualquier** proveedor.

## Por qué multi-proveedor

La instancia pública usa las API keys del **servidor** (no las del usuario final). Para no atarse a un proveedor ni agotar un tier gratis, el resumen rota entre los que estén configurados y cae al siguiente si uno falla. Gemini tiene tier gratis generoso → es el default.

## Arquitectura — `src/lib/resumen/`

```
system.ts              SYSTEM prompt + parseResumen() (JSON -> { resumen, temas })
types.ts               interface Provider { id, label, configured(), complete(system, texto) }
providers/anthropic.ts    Claude, vía @anthropic-ai/sdk
providers/gemini.ts       Gemini, vía REST generateContent (responseMimeType json)
providers/openai-compat.ts  OpenAI y OpenRouter (mismo protocolo /chat/completions)
index.ts               registry + rotación + fallback; exporta generarResumen() y hasSummaryProvider()
```

- Cada `Provider.complete(system, texto)` recibe **solo** `system` (prompt fijo) y `texto` (string = transcripción). No hay forma de pasarle otra cosa.
- `generarResumen(transcripcion)` devuelve `{ resumen, temas, proveedor }`. Rota el orden por minuto salvo que `AI_SUMMARY_PROVIDER_ORDER` fije uno estricto.
- El prompt pide **JSON** (`resumen_ejecutivo`, `tareas`, `fricciones`, `citas`); `parseResumen` tolera fences ```` ```json ```` y arma el markdown.

## Env vars (solo servidor, nunca `NEXT_PUBLIC_`)

`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY` — al menos una.
Opcionales: `AI_SUMMARY_PROVIDER_ORDER`, `AI_SUMMARY_DAILY_LIMIT`, `GEMINI_MODEL`/`OPENAI_MODEL`/`ANTHROPIC_MODEL`/`OPENROUTER_MODEL`.

## Rate limit

`generarResumenEntrevista` (en `entrevistas/actions.ts`) cuenta filas de `ia_usos` del usuario en las últimas 24 h contra `AI_SUMMARY_DAILY_LIMIT` (default 15) antes de llamar, e inserta una fila `ia_usos` tras cada éxito. Tabla creada en `0008_ia_usos` (RLS por dueño).

## Agregar un proveedor nuevo

1. `providers/<x>.ts` que exporte un `Provider` (mira `gemini.ts` como molde REST).
2. Sumalo a `ALL` y a `DEFAULT_ORDER` en `index.ts`.
3. Su key al `.env.example` y a la tabla del README.
4. `Provider.complete` manda **solo** `system` + `texto`. Punto.

## Guardas (chequear siempre)

- [ ] Ningún `complete()` recibe algo que no sea `system` + string. Nada de base64, rutas, imágenes.
- [ ] Las keys nunca en el bundle cliente (`grep -rn "_API_KEY" src` → solo archivos con `import "server-only"`).
- [ ] `src/lib/resumen/index.ts` tiene `import "server-only"`.
- [ ] Error/timeout de un proveedor no rompe la vista (se prueba el siguiente; si fallan todos, mensaje claro).
- [ ] El resultado es asistencia, no verdad final: la UI lo muestra como borrador editable.

Ver la skill `claude-api` para detalles del SDK de Anthropic (streaming, caching, ids de modelo vigentes).
