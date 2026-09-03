#!/usr/bin/env bash
# PostToolUse (Edit|Write) sobre *.sql en supabase/migrations/ — corre el validador de RLS.
# No bloquea; avisa por stderr si una tabla queda sin proteger.
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
. "$DIR/_lib.sh"

HOOK_JSON="$(cat)"
FILE="$(json_get '.tool_input.file_path' "$HOOK_JSON")"
[ -z "$FILE" ] && exit 0

case "$FILE" in
  *supabase/migrations/*.sql|*migrations/*.sql) : ;;
  *) exit 0 ;;
esac
[ -f "$FILE" ] || exit 0

ROOT="$(repo_root)"
OUT="$(bash "$ROOT/.claude/skills/create-migration/scripts/validate_rls.sh" "$FILE" 2>&1)"
CODE=$?

if [ "$CODE" -ne 0 ]; then
  echo "⚠️  validate-sql-rls: la migración '$FILE' tiene tablas sin RLS/policy correcta:" >&2
  echo "$OUT" | sed 's/^/    /' >&2
  echo "    -> Corregí según la skill supabase-rls-schema antes de aplicar/commitear." >&2
fi

exit 0
