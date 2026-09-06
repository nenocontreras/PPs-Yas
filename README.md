# App de Gestión de PPS

Aplicación web (PWA) para que estudiantes de **Lic. en Administración de Empresas (UCSE)**
gestionen sus **Prácticas Profesionales Supervisadas (PPS)**: bitácora de horas,
tareas y objetivos, banco de evidencia, calendario, y un módulo de entrevistas con
transcripción y resumen asistido por IA.

Pensada para uso individual pero **reutilizable por otros estudiantes** vía cuentas
separadas. El contexto completo y las reglas del proyecto están en
[`CLAUDE.md`](./CLAUDE.md).

> **Estado:** Fase 5 — auth + **Bitácora**, **Tareas**, **Calendario**,
> **Banco de evidencia** y **Panel de progreso** (pantalla de inicio: horas
> acumuladas, tareas por estado, próximos eventos, entrevistas en 0). Aplicá
> las migraciones de `supabase/migrations/` (ver abajo). Siguen: Entrevistas,
> Búsqueda, pulido PWA.

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
| `NEXT_PUBLIC_SITE_URL` | cliente + servidor | URL pública del sitio para los links de email de Supabase. Vacío en local (usa `localhost:3000`); en Vercel se resuelve solo vía `VERCEL_URL` si no lo definís |
| `ANTHROPIC_API_KEY` | **solo servidor** | Resumen de entrevistas (Fase 6). Nunca con prefijo `NEXT_PUBLIC_` |

Sin las dos variables de Supabase la app arranca (el dashboard muestra un aviso
de "falta configurar Supabase") pero no funciona la autenticación.

## Configurar Supabase (Fase 2 — Auth)

1. Crear un proyecto en [supabase.com](https://supabase.com) (plan free alcanza).
2. **Project Settings → API**: copiar `Project URL` y `anon public` key a
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. **Authentication → URL Configuration**:
   - *Site URL*: `http://localhost:3000` (y la URL de Vercel en producción).
   - *Redirect URLs*: agregar `http://localhost:3000/auth/confirm` y
     `https://<tu-deploy>.vercel.app/auth/confirm`.
4. **Authentication → Providers → Email**: dejar *Confirm email* **activado**
   (el flujo de la app espera confirmación). Para desarrollo alcanza con el
   servidor de email de prueba de Supabase; para producción configurar SMTP
   propio en *Authentication → Emails*.
5. *(Opcional, recomendado)* **Authentication → Emails → Confirm signup** y
   **Reset password**: cambiar el template para que el link apunte a
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` (y
   `type=recovery` + `&next=/actualizar-password` en el de reset). El route
   handler `src/app/auth/confirm/route.ts` también soporta el flujo `?code=` por
   defecto, así que este paso es opcional.

No hay migraciones SQL en esta fase: la autenticación usa solo `auth.users`, que
Supabase administra.

## Migraciones (Fase 3 en adelante)

Las tablas viven en `supabase/migrations/` (`0001_init` … `0005_evidencia`).
Cada tabla nace con `user_id` + RLS + las 4 policies en el mismo archivo
(`.claude/skills/supabase-rls-schema`). `0005_evidencia` además crea el bucket
privado de Storage `evidencia` y sus policies sobre `storage.objects` (mismo
criterio de dueño: el primer segmento de la ruta es el `user_id`). Si el
`insert into storage.buckets` de esa migración falla por permisos en el SQL
Editor, creá el bucket **antes** desde el panel (**Storage → New bucket →
nombre `evidencia`, Private, límite 10 MB**) y después corré la migración (el
`on conflict do nothing` deja pasar el bucket ya existente). Validar antes de
commitear:

```bash
bash .claude/skills/create-migration/scripts/validate_rls.sh supabase/migrations/*.sql
```

**Aplicarlas** (elegí una):
- **SQL Editor de Supabase**: pegar el contenido de cada archivo en orden
  (`0001` → `0004`) y ejecutar.
- **Supabase CLI**: `npx supabase link --project-ref <TU_PROJECT_ID>` y luego
  `npx supabase db push`.

**Regenerar los tipos** tras aplicar (opcional pero recomendado —
`src/lib/database.types.ts` está escrito a mano por ahora):

```bash
npx supabase gen types typescript --project-id <TU_PROJECT_ID> > src/lib/database.types.ts
```

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
    (auth)/             # login, registro, recuperar, actualizar-password, verifica-tu-email
    (dashboard)/        # layout con navegación + un módulo por carpeta
      bitacora/  tareas/  calendario/     # Fase 3: page.tsx + <Modulo>-view.tsx + actions.ts
      evidencia/  entrevistas/  busqueda/ # placeholders (Fases 4, 6, 7)
    auth/confirm/       # route handler de los links de email
    ~offline/           # fallback offline de la PWA
    proxy.ts (en src/)  # refresca sesión + protege el dashboard
  components/ui/        # Button, TextField, AuthCard, Alert, StatusPill, HoursProgress, …
  lib/
    modules.ts          # metadatos de los módulos (fuente única para la nav)
    database.types.ts   # tipos del esquema (a mano; regenerar con supabase gen types)
    bitacora.ts  tareas.ts  calendario.ts   # queries tipadas por módulo
    supabase/            # clientes browser / server / proxy + requireUser
supabase/migrations/    # 0001_init … 0004_eventos
```

Convenciones de esquema y RLS: `.claude/skills/supabase-rls-schema/SKILL.md`.
Reglas de confidencialidad: `.claude/skills/confidentiality-guard/SKILL.md`.

## Licencia

Pendiente de definir (MIT sugerida) — se agrega en la Fase 8.
