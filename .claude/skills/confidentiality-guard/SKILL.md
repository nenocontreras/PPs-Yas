---
name: confidentiality-guard
description: Usar siempre que la tarea involucre audio, entrevistas, transcripciones, datos de personas reales, o cualquier flujo que envíe datos a un backend o a una API externa. Protege el requisito no negociable de confidencialidad del proyecto (Art. 15° del Reglamento de PPS - UCSE) y el principio "código público, datos privados".
---

# Guardián de confidencialidad

Este proyecto maneja información de empleados reales de organizaciones donde estudiantes hacen su PPS. El Art. 15° del Reglamento de PPS de la UCSE obliga a "guardar estricta confidencialidad de los datos". El repositorio es **público desde el día uno**. Esta skill existe para que ninguna implementación técnica viole esa obligación, incluso sin mala intención.

## Reglas obligatorias

1. **El audio nunca toca un servidor.** Ninguna ruta de API (`route.ts`, Route Handler, Server Action, Supabase Edge Function, etc.) debe recibir un archivo de audio como payload. La transcripción se hace 100% en el cliente (navegador/dispositivo) con `transformers.js` / Whisper WASM. Si ves un `FormData`, `Blob`, `File`, `ArrayBuffer` o `MediaRecorder` cuyo destino es un `fetch()` a una ruta propia o de terceros → es una violación.
2. **Ninguna tabla de Postgres almacena audio ni rutas a archivos de audio.** La tabla `entrevistas` no lleva columna `audio_path`, `audio_url`, ni equivalente. Ver `supabase-rls-schema` para qué sí se puede guardar (texto transcripto ya editado, metadatos).
3. **Todo envío a la API de Claude (Anthropic) debe ser texto**, nunca audio ni imágenes con identificación de personas. El texto que se manda es el que el usuario ya revisó y anonimizó en el textarea editable.
4. **Nombres propios de terceros** (empleados entrevistados, la empresa donde se hace la PPS) no deben aparecer hardcodeados en ningún dato de ejemplo, fixture, seed, test, comentario, o mensaje de commit del repo público. Datos de ejemplo → nombres claramente ficticios ("Empleado A", "Ana Ejemplo", "Empresa Demo S.A.").
5. **Storage de Supabase**: el bucket de evidencia es **privado** por default, nunca público. Sus policies siguen el mismo criterio `auth.uid() = user_id` que las tablas (ver `supabase-rls-schema`).
6. **Secretos**: `.env*`, claves de Supabase (`SUPABASE_SERVICE_ROLE_KEY`, `anon key`), API keys de Anthropic (`sk-ant-...`) nunca se commitean ni se pegan en código. `.env.local` siempre en `.gitignore`.

## Cómo actuar si un pedido entra en conflicto con estas reglas

Si el usuario pide algo que rompe una regla (ej: "guardemos el audio en Supabase Storage para reproducirlo después"), Claude Code debe:
1. **Señalar explícitamente** el conflicto con la regla antes de implementar nada.
2. **Ofrecer una alternativa** que preserve el objetivo sin violar la regla (ej: guardar el audio *solo* en el dispositivo vía IndexedDB del navegador, nunca en el servidor).
3. **Implementar solo después** de que el usuario confirme qué alternativa prefiere.

No asumir que una regla se relaja "solo por ahora, para probar". Cualquier commit puede quedar expuesto para siempre en el historial de un repo público.

## Chequeos automáticos que respaldan esta skill

Estas reglas también están cableadas como hooks en `.claude/settings.json` — la skill es el "por qué", los hooks son el "no dejar pasar":

- `hooks/block-secrets.sh` (PreToolUse): bloquea leer/editar cualquier `.env*`.
- `hooks/confidentiality-scan.sh` (PostToolUse tras `Edit`/`Write`): avisa si el archivo tocado contiene términos prohibidos (lista en `.claude/hooks/forbidden-terms.txt`, no versionada) o un `fetch` con payload de audio.
- `hooks/pre-commit-scan.sh` (PreToolUse antes de `git commit`): escanea el diff staged por secretos y términos prohibidos y **bloquea** el commit si encuentra algo.

Si un hook marca un falso positivo, corregí el patrón en `.claude/hooks/forbidden-terms.txt` — no desactives el hook.

## Checklist antes de cada push / antes de hacer público el repo

- [ ] Ningún `route.ts` / Server Action recibe audio.
- [ ] `entrevistas` no tiene columna de audio.
- [ ] Ningún envío a la API de Claude incluye algo que no sea texto.
- [ ] `grep -ri "empresa-demo\|<nombres reales>"` sobre `src/`, migraciones y seeds → 0 resultados.
- [ ] `git log -p | grep -i "sk-ant-\|service_role\|SUPABASE.*KEY"` → 0 resultados.
- [ ] `.env.local` está en `.gitignore` y nunca fue commiteado.
