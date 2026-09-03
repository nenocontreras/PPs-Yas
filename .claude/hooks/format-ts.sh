#!/usr/bin/env bash
# PostToolUse (Edit|Write) sobre *.ts/*.tsx — formatea con prettier y hace type-check.
# No bloquea. Se auto-desactiva si el proyecto todavía no tiene package.json.
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
. "$DIR/_lib.sh"

HOOK_JSON="$(cat)"
FILE="$(json_get '.tool_input.file_path' "$HOOK_JSON")"
[ -z "$FILE" ] && exit 0
case "$FILE" in *.ts|*.tsx|*.js|*.jsx) : ;; *) exit 0 ;; esac
[ -f "$FILE" ] || exit 0

ROOT="$(repo_root)"
[ -f "$ROOT/package.json" ] || exit 0
command -v npx >/dev/null 2>&1 || exit 0

# prettier (si está en el proyecto)
if [ -f "$ROOT/.prettierrc" ] || [ -f "$ROOT/.prettierrc.json" ] || [ -f "$ROOT/prettier.config.js" ] || grep -q '"prettier"' "$ROOT/package.json" 2>/dev/null; then
  npx --no-install prettier --write "$FILE" >/dev/null 2>&1 || true
fi

# type-check del proyecto (rápido; solo avisa)
if grep -q '"typescript"' "$ROOT/package.json" 2>/dev/null; then
  ERR="$(cd "$ROOT" && npx --no-install tsc --noEmit --pretty false 2>&1 | grep -F "$(basename "$FILE")" | head -n 20)"
  if [ -n "$ERR" ]; then
    echo "⚠️  type-check en $(basename "$FILE"):" >&2
    echo "$ERR" | sed 's/^/    /' >&2
  fi
fi

exit 0
