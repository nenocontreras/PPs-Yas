# App de Gestión de PPS

Aplicación web (PWA) para que estudiantes de **Lic. en Administración de Empresas (UCSE)**
gestionen sus **Prácticas Profesionales Supervisadas (PPS)**: bitácora de horas,
tareas y objetivos, banco de evidencia, calendario, y un módulo de entrevistas con
transcripción y resumen asistido por IA.

Pensada para uso individual pero **reutilizable por otros estudiantes** vía cuentas
separadas. El contexto completo y las reglas del proyecto están en
[`CLAUDE.md`](./CLAUDE.md).

> **Estado:** Fase 1 — esqueleto navegable e instalable como PWA. Todavía sin
> módulos funcionales ni autenticación.

## Principio no negociable: "código público, datos privados"

- El repo es público; **nunca** contiene datos reales de empresas, entrevistas ni
  personas.
- Todo dato de un usuario vive en su cuenta, protegido por Row Level Security (RLS)
  en Postgres.
- **El audio de las entrevistas nunca se transmite a un servidor ni a una API
  externa.** La transcripción corre 100% en el dispositivo (Whisper WASM). A la API
  de Claude solo se envía texto ya transcripto y revisado por el usuario.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 (App Router) + TypeScript estricto + Tailwind CSS v4 |
| PWA | [`@serwist/next`](https://serwist.pages.dev) (service worker + precache + offline) |
| Backend / DB | Supabase (Postgres + Auth + Storage + pgvector) |
| Transcripción | `transformers.js` (Whisper, WASM, client-side) — Fase 6 |
| Resumen / búsqueda | API de Claude (Anthropic) sobre texto — Fases 6 y 7 |
| Hosting | Vercel (frontend) + Supabase (backend) |

> **Nota de build:** Serwist en modo plugin todavía no soporta Turbopack, así que
> `dev` y `build` usan webpack (`next dev --webpack` / `next build --webpack`).

## Correr en local

Requisitos: Node.js 20+ y npm.

```bash
npm install
cp .env.example .env.local   # completá los valores (ver abajo)
npm run dev                  # http://localhost:3000
```

Otros scripts:

```bash
npm run build       # build de producción
npm start           # sirve el build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
```

### Variables de entorno

Se definen en `.env.local` (en `.gitignore`, nunca se commitea). La plantilla es
[`.env.example`](./.env.example):

| Variable | Ámbito | Para qué |
|----------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | cliente + servidor | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente + servidor | Clave anónima (pública por diseño; el aislamiento lo hace RLS) |
| `ANTHROPIC_API_KEY` | **solo servidor** | Resumen de entrevistas (Fase 6). Nunca con prefijo `NEXT_PUBLIC_` |

Sin las dos variables de Supabase la app arranca pero tira un error claro al
instanciar el cliente.

## PWA

- `src/app/manifest.ts` → se sirve en `/manifest.webmanifest`.
- Íconos **placeholder** en `public/icons/` (192, 512, 192/512 maskable, apple-touch
  180), generados por `node scripts/gen-icons.mjs`. Reemplazar por los definitivos
  en la Fase 8 (falta también `screenshots` en el manifest y `apple-touch-startup-image`).
- Service worker en `src/app/sw.ts`, se compila a `public/sw.js` en el build
  (ignorado por git). **Solo se registra en producción.**
- `scripts/fix-sw-paths.mjs` corre en `postbuild`: normaliza `\` → `/` en las URLs
  del precache (bug de `@serwist/next` al buildear en Windows; no-op en Linux/Vercel).
- Runtime caching: las respuestas de Supabase van `NetworkFirst` con TTL de 30 min
  y `/auth/v1/*` es `NetworkOnly` (datos privados nunca cache-first). Al implementar
  `signOut` (Fase 2) hay que limpiar el cache `supabase`.
- Fallback offline de navegación: `src/app/~offline/` (precacheado explícitamente
  en `sw.ts`; subir el `revision` si cambia la página).
- Para probarlo: `npm run build && npm start`, abrir en Chrome → DevTools →
  Application → Manifest / Service Workers, o "Agregar a pantalla de inicio" en
  Chrome Android. Correr Lighthouse (categoría PWA) antes de cerrar la Fase 8.

## Servidores MCP (opcional, para desarrollo con Claude Code)

`.mcp.json` define dos servidores:

- **supabase** (`read_only=true`): migraciones, tipos TS, logs.
- **context7**: documentación viva de las librerías del stack.

Activarlos la primera vez: abrir el repo en Claude Code y correr `/mcp` para
autenticar `supabase` (login por navegador). Para aplicar migraciones se usa
`supabase db push` o se quita temporalmente `?read_only=true`.

## Estructura

```
src/
  app/
    (dashboard)/        # layout con navegación + páginas de cada módulo
      bitacora/  tareas/  evidencia/  calendario/  entrevistas/  busqueda/
      layout.tsx  page.tsx
    ~offline/           # fallback offline de la PWA
    layout.tsx  manifest.ts  sw.ts  globals.css
  components/           # UI reutilizable (navegación, íconos, placeholders)
  lib/
    modules.ts          # metadatos de los módulos (fuente única para la nav)
    supabase/            # clientes browser y server (@supabase/ssr)
```

Convenciones de esquema y RLS: `.claude/skills/supabase-rls-schema/SKILL.md`.
Reglas de confidencialidad: `.claude/skills/confidentiality-guard/SKILL.md`.

## Licencia

Pendiente de definir (MIT sugerida) — se agrega en la Fase 8.
