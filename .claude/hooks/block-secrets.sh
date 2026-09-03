#!/usr/bin/env bash
# PreToolUse (Edit|Write|Read) — bloquea tocar archivos de secretos.
# Exit 2 = bloquear (el motivo va por stderr y lo ve Claude).
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
. "$DIR/_lib.sh"

HOOK_JSON="$(cat)"
FILE="$(json_get '.tool_input.file_path' "$HOOK_JSON")"
[ -z "$FILE" ] && exit 0

base="$(basename "$FILE")"
case "$base" in
  .env|.env.*|*.env|.envrc)
    # permitir explícitamente los ejemplos
    case "$base" in
      .env.example|.env.sample|.env.template) exit 0 ;;
    esac
    echo "BLOQUEADO: '$FILE' es un archivo de secretos. Regla de CLAUDE.md / confidentiality-guard: nunca leer, editar ni commitear .env*. Usá .env.example para documentar variables." >&2
    exit 2
    ;;
esac

# claves sueltas por nombre de archivo
case "$base" in
  *service_role*|*serviceRole*|*.pem|*.key|id_rsa|credentials.json)
    echo "BLOQUEADO: '$FILE' parece contener credenciales. Confirmá con el usuario antes de tocarlo." >&2
    exit 2
    ;;
esac

exit 0
