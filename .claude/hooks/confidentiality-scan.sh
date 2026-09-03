#!/usr/bin/env bash
# PostToolUse (Edit|Write) — escanea el archivo tocado por datos privados / audio hacia el server.
# No bloquea (exit 0 siempre). Emite avisos por stderr para que Claude los vea.
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
. "$DIR/_lib.sh"

HOOK_JSON="$(cat)"
FILE="$(json_get '.tool_input.file_path' "$HOOK_JSON")"
[ -z "$FILE" ] || [ ! -f "$FILE" ] && exit 0

ROOT="$(repo_root)"
TERMS_FILE="$ROOT/.claude/hooks/forbidden-terms.txt"
warn() { echo "⚠️  confidentiality-scan: $1" >&2; }

# 1) términos prohibidos (empresa / nombres reales). Lista NO versionada.
if [ -f "$TERMS_FILE" ]; then
  while IFS= read -r term; do
    case "$term" in ''|\#*) continue ;; esac
    if grep -niF "$term" "$FILE" >/dev/null 2>&1; then
      warn "'$FILE' menciona un término marcado como privado: \"$term\". Reemplazá por un valor ficticio antes de commitear."
    fi
  done < "$TERMS_FILE"
fi

# 2) claves / secretos embebidos
if grep -nE 'sk-ant-[A-Za-z0-9_-]{8,}|SUPABASE_SERVICE_ROLE_KEY[[:space:]]*=[[:space:]]*[A-Za-z0-9]|service_role.*ey[A-Za-z0-9]' "$FILE" >/dev/null 2>&1; then
  warn "'$FILE' parece contener una clave/secreto embebido. Mové el valor a .env.local (nunca commiteado)."
fi

# 3) audio hacia un endpoint (regla dura de confidentiality-guard)
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx)
    if grep -nE '(fetch|axios|\.rpc\(|supabase\.functions\.invoke)\(' "$FILE" >/dev/null 2>&1 \
       && grep -niE 'audio|Blob|MediaRecorder|\.webm|\.wav|\.mp3|\.m4a|ArrayBuffer' "$FILE" >/dev/null 2>&1; then
      warn "'$FILE' mezcla una llamada de red con audio. El audio NUNCA sale del dispositivo (confidentiality-guard). Verificá que el Blob de audio no sea el payload."
    fi
    ;;
esac

# 4) columna de audio en migraciones
case "$FILE" in
  *.sql)
    if grep -niE 'audio_(path|url|file|blob)|grabacion_(path|url)' "$FILE" >/dev/null 2>&1; then
      warn "'$FILE' define una columna de audio. Ninguna tabla almacena audio ni rutas de audio (confidentiality-guard)."
    fi
    ;;
esac

exit 0
