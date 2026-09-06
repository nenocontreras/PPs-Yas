# App de Gestión de PPS

Aplicación web (PWA, instalable en el celular) para que estudiantes de **Lic. en
Administración de Empresas (UCSE)** gestionen sus **Prácticas Profesionales
Supervisadas (PPS)**:

- **Bitácora** de jornadas y horas, con progreso hacia el mínimo reglamentario (130 hs).
- **Tareas / objetivos** con estado y asociación a bloques de la Ficha Maestra.
- **Calendario** de jornadas, entregas e hitos.
- **Banco de evidencia**: documentos, capturas y notas, privados por usuario.
- **Panel de progreso** como pantalla de inicio (horas, tareas, próximos eventos, ritmo estimado).
- **Entrevistas**: metadatos + transcripción de audio **100 % en el dispositivo** + resumen asistido por IA.
- **Búsqueda semántica** en lenguaje natural sobre todo lo anterior.

Fue creada para uso individual pero está diseñada desde el modelo de datos para
que **cualquier estudiante la use con su propia cuenta**. El contexto y las
reglas del proyecto están en [`CLAUDE.md`](./CLAUDE.md).

## Confidencialidad — "código público, datos privados"

El repositorio es público; **el código nunca contiene datos reales** de empresas,
entrevistas ni personas. Además:

- Todo dato de un usuario vive en su cuenta, aislado por **Row Level Security
  (RLS)** en Postgres. Nadie ve los datos de otro.
- **El audio de las entrevistas nunca sale del dispositivo.** Se transcribe en el
  navegador con Whisper (WASM/WebGPU). Ninguna ruta del backend recibe audio y
  la base no guarda audio ni rutas de audio.
- A la API de Claude (resumen de entrevistas) se envía **solo texto**, y solo el
  que el usuario ya revisó y anonimizó.

---

## Para estudiantes: cómo usarla

### Opción A — usar la instancia pública

Si hay un deploy público disponible, entrá, creá una cuenta con tu email,
confirmala desde el mail que te llega, y listo. Tus datos quedan en tu cuenta.

### Opción B — desplegar tu propia instancia

Recomendada si querés control total de tus datos. Necesitás una cuenta gratis en
[Supabase](https://supabase.com) y otra en [Vercel](https://vercel.com).

1. **Fork / clon** de este repo.
2. **Supabase**: creá un proyecto (plan free alcanza).
   - *Project Settings → API*: anotá `Project URL` y la `anon public` key.
   - *Authentication → URL Configuration*: en *Redirect URLs* agregá
     `https://TU-DEPLOY.vercel.app/auth/confirm` (y `http://localhost:3000/auth/confirm`
     si vas a correr en local).
   - *Authentication → Providers → Email*: dejá **Confirm email** activado.
   - **Aplicá las migraciones** de [`supabase/migrations/`](./supabase/migrations)
     en orden (`0001` → `0007`) desde el *SQL Editor* (pegá y ejecutá cada
     archivo). Antes de `0005`, creá un bucket de Storage **privado** llamado
     `evidencia` (*Storage → New bucket*, Private, límite 10 MB).
3. **Vercel**: importá el repo y configurá las variables de entorno (abajo). El
   build ya está fijado a webpack (`next build --webpack`).
4. *(Opcional)* Para el resumen de entrevistas, conseguí una API key de Anthropic
   y ponela como `ANTHROPIC_API_KEY` en Vercel. Sin ella todo funciona salvo ese
   botón.

### Variables de entorno

Plantilla: [`.env.example`](./.env.example). En local van en `.env.local` (que
está en `.gitignore` — **nunca se commitea**).

| Variable | Ámbito | Para qué |
|----------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | cliente + servidor | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente + servidor | Clave anónima (pública por diseño; el aislamiento lo hace RLS) |
| `NEXT_PUBLIC_SITE_URL` | cliente + servidor | URL pública para los links de email de Supabase. Vacío en local; en Vercel se resuelve solo vía `VERCEL_URL` |
| `ANTHROPIC_API_KEY` | **solo servidor** | Resumen de entrevistas. Nunca con prefijo `NEXT_PUBLIC_` |

---

## Correr en local

Requisitos: Node.js 20+ y npm.

```bash
npm install
cp .env.example .env.local   # completá los valores
npm run dev                  # http://localhost:3000
```

| Script | Qué hace |
|--------|----------|
| `npm run dev` | servidor de desarrollo (webpack) |
| `npm run build` / `npm start` | build de producción y server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

> **Build:** Serwist (PWA) todavía no soporta Turbopack en Next 16, así que
> `dev` y `build` usan `--webpack`.

---

## Arquitectura (resumen)

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 (App Router) + TypeScript estricto + Tailwind CSS v4 |
| PWA | `@serwist/next` — manifest, service worker, precache del app shell, fallback offline |
| Auth / DB / Storage | Supabase (Postgres + Auth + Storage + pgvector) |
| Transcripción | `@huggingface/transformers` (Whisper `whisper-base`), en un Web Worker, client-side |
| Embeddings (búsqueda) | `@huggingface/transformers` (`Supabase/gte-small`, 384 dims), client-side |
| Resumen | API de Claude (Anthropic), `claude-sonnet-5`, solo texto, server-side |
| Hosting | Vercel (frontend) + Supabase (backend) |

```
src/
  app/
    (auth)/              login · registro · recuperar · actualizar-password · verifica-tu-email
    (dashboard)/         layout con navegación + un módulo por carpeta:
      page.tsx           panel de progreso (pantalla de inicio)
      bitacora/  tareas/  calendario/  evidencia/  entrevistas/  busqueda/
    auth/confirm/        route handler de los links de email
    ~offline/            fallback offline de la PWA
    manifest.ts  sw.ts
  proxy.ts               refresca la sesión de Supabase + protege el dashboard
  components/
    ui/                  Button · TextField · AuthCard · Alert · StatusPill · HoursProgress · …
    transcription/       grabador + panel de transcripción (Whisper)
  lib/
    database.types.ts    tipos del esquema (a mano; regenerar con `supabase gen types`)
    supabase/            clientes browser / server / proxy + requireUser
    transcription/  embeddings/   Web Workers de los modelos
    <modulo>.ts          queries tipadas por módulo
supabase/migrations/     0001_init … 0007_busqueda
design-system/           tokens + previews de componentes (sincronizado con Claude Design)
.claude/                 skills, subagents y hooks que blindan las reglas de CLAUDE.md
```

**Convenciones**: esquema y RLS en `.claude/skills/supabase-rls-schema/SKILL.md`;
confidencialidad en `.claude/skills/confidentiality-guard/SKILL.md`. Toda tabla
nace con `user_id` + RLS + 4 policies en el mismo commit.

### Rutas con aislamiento cross-origin

`/entrevistas/*` y `/busqueda/*` sirven `COOP: same-origin` +
`COEP: credentialless` (solo esas rutas) para habilitar los threads WASM de los
modelos. No afecta al resto de la app (p. ej. las URLs firmadas de Evidencia).

Safari (iOS) todavía no soporta `COEP: credentialless`, así que en iPhone el
aislamiento no se activa y la transcripción corre single-thread (más lenta, pero
funciona: el worker cae al backend WASM sin threads).

### Regenerar los tipos tras una migración

```bash
npx supabase gen types typescript --project-id <TU-PROJECT-ID> > src/lib/database.types.ts
```

---

## PWA

- `src/app/manifest.ts` → `/manifest.webmanifest`. Íconos en `public/icons/`
  (192, 512, 192/512 maskable, apple-touch 180), generados por
  `node scripts/gen-icons.mjs` — reemplazá por los definitivos cuando los tengas.
- Service worker en `src/app/sw.ts` → `public/sw.js` en el build (gitignored).
  **Solo se registra en producción.** `scripts/fix-sw-paths.mjs` (postbuild)
  normaliza un bug de rutas de `@serwist/next` en Windows (no-op en Vercel).
- Runtime caching: Supabase `NetworkFirst` (TTL 30 min), `/auth/v1/*`
  `NetworkOnly`, `.wasm` de los modelos fuera del precache.
- Probar: `npm run build && npm start` → Chrome DevTools → Application, o
  "Agregar a pantalla de inicio" en Chrome Android. Correr Lighthouse (PWA).

## Servidores MCP (opcional, para desarrollo con Claude Code)

`.mcp.json` define **supabase** (`read_only`) y **context7** (docs de librerías).
Activar con `/mcp` en Claude Code.

## Licencia

[MIT](./LICENSE) © Contreras Nazareno.
