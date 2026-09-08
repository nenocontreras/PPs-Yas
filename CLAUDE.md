# CLAUDE.md — App de Gestión de PPS

Este archivo es leído automáticamente por Claude Code al iniciar cualquier sesión en este repositorio. Contiene el contexto y las reglas que **siempre** debe respetar, sin necesidad de que se las repitan en cada prompt.

## Qué es este proyecto

Aplicación web (PWA) para que estudiantes de Lic. en Administración de Empresas (UCSE) gestionen sus Prácticas Profesionales Supervisadas (PPS): bitácora de horas, tareas/objetivos, banco de evidencia, calendario, y un módulo de entrevistas con transcripción y resumen asistido por IA.

Creada originalmente para uso individual de una estudiante durante su PPS, pero diseñada desde el modelo de datos para ser **reutilizable por otros estudiantes** vía cuentas separadas. Ningún dato real de la empresa, del área ni de las personas entrevistadas vive en este repo (ver el principio de abajo).

Repositorio: público en GitHub. Licencia: MIT (o la que se defina).

## Principio no negociable: "código público, datos privados"

- El código de este repo no debe contener nunca datos reales de ninguna empresa, entrevista, ni información identificable de personas.
- Todo dato generado por un usuario (bitácora, entrevistas, evidencia) pertenece exclusivamente a ese usuario y debe estar protegido por Row Level Security (RLS) en Postgres.
- **El audio de las entrevistas nunca se transmite a un servidor ni a una API externa.** La transcripción corre en el dispositivo del usuario (navegador/celular) vía Whisper WASM (`transformers.js`). Ninguna ruta de backend debe recibir ni almacenar archivos de audio.
- Cualquier envío de datos a una API de IA (resumen de entrevistas — Gemini / OpenAI / Claude / OpenRouter) se hace **solo con texto ya transcripto y anonimizado**, nunca con audio ni imágenes.

Si en algún momento una tarea pedida implica romper alguno de estos puntos (ej: "subamos el audio al servidor para procesarlo más rápido"), Claude Code debe señalarlo explícitamente antes de implementarlo, no hacerlo en silencio.

## Stack técnico

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **PWA**: `@serwist/next` (manifest + service worker). Build con `--webpack` (Serwist plugin no soporta Turbopack en Next 16).
- **Backend/DB**: Supabase (Postgres + Auth + Storage + pgvector)
- **Transcripción**: `@huggingface/transformers` **v3** (Whisper `whisper-small` q8, ~240 MB, WASM single-thread, client-side). v4 trae un onnxruntime-web `-dev` que rompe los modelos cuantizados de whisper — quedarse en v3.x. Runtime WASM self-hosteado en `/public/ort/` (`scripts/copy-ort-wasm.mjs`).
- **Resumen de entrevistas**: adaptador multi-proveedor (`src/lib/resumen/`) — Gemini / OpenAI / Claude / OpenRouter, con rotación y fallback; solo texto ya anonimizado
- **Búsqueda**: embeddings client-side (`gte-small`) + pgvector
- **Hosting**: Vercel (frontend) + Supabase (backend)

## Reglas de modelo de datos

- Toda tabla nueva en Postgres debe incluir `user_id UUID NOT NULL REFERENCES auth.users(id)` desde el primer commit, aunque la funcionalidad se use con un solo usuario por ahora.
- Toda tabla nueva debe tener `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` y las 4 policies `auth.uid() = user_id` en el mismo PR/commit que la crea. Nunca crear una tabla con datos de usuario sin sus policies.
- Usar `UUID` como tipo de clave primaria (no autoincremental), vía `gen_random_uuid()`.
- Ver `.claude/skills/supabase-rls-schema/SKILL.md` para el detalle completo de convenciones de esquema.

## Convenciones de código

- TypeScript estricto (`strict: true` en `tsconfig.json`).
- Componentes en `src/components/`, lógica de datos en `src/lib/`, rutas en `src/app/`.
- Nombrar archivos y componentes en inglés (convención de código estándar); los textos visibles al usuario van en español rioplatense (público objetivo: estudiantes argentinos).
- Commits en español, formato breve tipo `feat: agrega módulo de bitácora`, `fix: corrige cálculo de horas acumuladas`.
- Cada módulo funcional (bitácora, tareas, evidencia, entrevistas, calendario, búsqueda) vive en su propia carpeta bajo `src/app/(dashboard)/`.

## Orden de construcción (no saltear fases sin avisar)

1. Esqueleto (Next.js + Tailwind + Supabase + PWA)
2. Autenticación (Supabase Auth)
3. Bitácora + Tareas + Calendario
4. Banco de evidencia
5. Panel de progreso
6. Módulo de entrevistas (metadatos → transcripción client-side → resumen vía API)
7. Búsqueda semántica (pgvector)
8. Pulido PWA + README para otros estudiantes + licencia

El detalle de cada fase está en `PROMPTS_MAESTROS.md` (fuera del repo). No implementar funcionalidad de una fase posterior antes de que la anterior esté funcional de punta a punta, salvo pedido explícito.

## Referencias académicas del proyecto (contexto, no código)

Estos documentos viven fuera del repo (en el proyecto de Claude usado para mentoría académica), pero es útil que Claude Code sepa que existen por si se le pide generar contenido relacionado:
- Reglamento de PPS de la Facultad de Ciencias Económicas (UCSE)
- Ficha Maestra del proyecto (bloques temáticos 1-7)
- Plan de cátedra de Recursos Humanos

Claude Code no necesita el contenido de estos documentos para programar la app — son contexto académico, no requisitos técnicos.

## Qué NO hacer

- No agregar autenticación de terceros más allá de Supabase Auth sin que se pida explícitamente.
- No introducir una vector DB externa (Pinecone, Weaviate, etc.) — pgvector alcanza para el volumen de este proyecto.
- No subir `.env`, claves de Supabase ni de ningún proveedor de IA (Gemini, OpenAI, Anthropic, OpenRouter), ni ningún dato de ejemplo con información real de empresas o personas al repo público.
- No implementar la apertura multi-usuario / onboarding para otros estudiantes hasta cerrar la primera versión completa para un solo usuario (Fase 8).
