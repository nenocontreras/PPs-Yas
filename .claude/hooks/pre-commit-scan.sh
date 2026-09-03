#!/usr/bin/env bash
# PreToolUse (Bash) — si el comando es `git commit`, escanea el diff staged.
# Exit 2 = bloquea el commit (secretos o términos privados en lo que se va a commitear).
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
. "$DIR/_lib.sh"

HOOK_JSON="$(cat)"
CMD="$(json_get '.tool_input.command' "$HOOK_JSON")"

case "$CMD" in
  *"git commit"*|*"git commit"*|*"git"*"commit"*) : ;;
  *) exit 0 ;;
esac

command -v git >/dev/null 2>&1 || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

STAGED="$(git diff --cached -U0 2>/dev/null)"
[ -z "$STAGED" ] && exit 0

ROOT="$(repo_root)"
TERMS_FILE="$ROOT/.claude/hooks/forbidden-terms.txt"
HITS=""

# secretos
if printf '%s' "$STAGED" | grep -nE '^\+.*(sk-ant-[A-Za-z0-9_-]{8,}|SUPABASE_SERVICE_ROLE_KEY[[:space:]]*=[[:space:]]*[A-Za-z0-9]|-----BEGIN [A-Z ]*PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,})' >/dev/null 2>&1; then
  HITS="$HITS\n- Posible secreto/clave en el diff staged."
fi

# archivos .env staged
if git diff --cached --name-only 2>/dev/null | grep -E '(^|/)\.env($|\.)' | grep -vE '\.env\.(example|sample|template)$' >/dev/null 2>&1; then
  HITS="$HITS\n- Hay un archivo .env staged. Quitalo con: git restore --staged <archivo>"
fi

# términos privados
if [ -f "$TERMS_FILE" ]; then
  while IFS= read -r term; do
    case "$term" in ''|\#*) continue ;; esac
    if printf '%s' "$STAGED" | grep -niF "+$term" >/dev/null 2>&1 || printf '%s' "$STAGED" | grep -niF "$term" | grep -q '^+'; then
      HITS="$HITS\n- Término privado en el diff: \"$term\""
    fi
  done < "$TERMS_FILE"
fi

if [ -n "$HITS" ]; then
  printf 'COMMIT BLOQUEADO por confidentiality-guard:%b\n\nRevisá y corregí antes de commitear (el repo es público).\n' "$HITS" >&2
  exit 2
fi

exit 0
