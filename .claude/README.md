# Configuración de Claude Code — App de Gestión de PPS

Este directorio (`.claude/`) blinda las reglas de `CLAUDE.md` para que se cumplan automáticamente,
no solo "de memoria". Copiar tal cual a la raíz del repo.

## Contenido

### Skills (`.claude/skills/`)
| Skill | Para qué | Invocación |
|-------|----------|------------|
| `confidentiality-guard` | Principio "código público, datos privados": audio nunca al server, nada de datos reales en el repo. | Claude (auto) |
| `supabase-rls-schema` | Convenciones de esquema + RLS obligatorio en toda tabla. | Claude (auto) |
| `create-migration` | Genera una migración SQL validada (`/create-migration`). | Usuario |
| `new-module` | Scaffold de un módulo del dashboard (`/new-module`). | Usuario |
| `whisper-transcribe-setup` | Transcripción client-side con transformers.js / Whisper WASM. | Ambos |
| `claude-api-summary` | Resumen de entrevistas con IA — adaptador multi-proveedor (Gemini/OpenAI/Claude/OpenRouter), solo texto. | Ambos |

### Subagents (`.claude/agents/`)
| Agente | Cuándo usarlo |
|--------|---------------|
| `rls-auditor` | Tras tocar `supabase/migrations/`. |
| `confidentiality-reviewer` | Antes de cada push; antes de hacer público el repo. |
| `supabase-security-reviewer` | Tras tocar auth, middleware, clientes de Supabase, Storage. |
| `pwa-auditor` | Fases 1 y 8; tras tocar manifest / service worker. |
| `a11y-mobile-reviewer` | Tras crear/editar componentes de UI. |

Invocar con: `> usá el subagente rls-auditor` (o el que corresponda).

### Hooks (`.claude/settings.json` + `.claude/hooks/`)
| Hook | Evento | Efecto |
|------|--------|--------|
| `block-secrets.sh` | PreToolUse Edit/Write/Read | **Bloquea** tocar `.env*` y archivos de claves. |
| `pre-commit-scan.sh` | PreToolUse Bash | **Bloquea** `git commit` si hay secretos o términos privados en el diff staged. |
| `confidentiality-scan.sh` | PostToolUse Edit/Write | Avisa si un archivo tiene términos privados, claves, o audio hacia un endpoint. |
| `validate-sql-rls.sh` | PostToolUse Edit/Write | Avisa si una migración tiene tablas sin RLS/policy. |
| `format-ts.sh` | PostToolUse Edit/Write | Prettier + `tsc --noEmit` (se auto-desactiva sin `package.json`). |

`forbidden-terms.txt` **no se versiona** (ver `.gitignore`). Cada dev pone ahí, en su copia local,
el nombre real de la empresa y de las personas entrevistadas. Los hooks lo leen si existe.

### MCP servers (`.mcp.json`, en la raíz del repo)
- **supabase** (en `read_only=true`): migraciones, tipos TS, logs, branches. Login por navegador con `/mcp`.
  Para aplicar migraciones, quitar `?read_only=true` temporalmente o usar `supabase db push`.
- **context7**: docs vivas de Next.js, `@supabase/ssr`, `@huggingface/transformers`.

Instalar/activar: abrir Claude Code en el repo → `/mcp` → autenticar `supabase`.
Opcionales para más adelante: Playwright MCP (test de PWA en fase 8), GitHub MCP, Vercel MCP.

### Plugins sugeridos (no incluidos, se instalan con `/plugin`)
- `frontend-design` — UI mobile-first.
- `commit-commands` — `/commit` en español, `/commit-push-pr`.

## Añadir a `.gitignore` del repo

```
.env
.env.local
.env*.local
.claude/hooks/forbidden-terms.txt
.claude/settings.local.json
```

## Requisito

Los hooks usan `bash`. En Windows viene con Git for Windows (Git Bash). En Linux/Mac ya está.
`jq` es opcional (los hooks tienen fallback sin `jq`).
