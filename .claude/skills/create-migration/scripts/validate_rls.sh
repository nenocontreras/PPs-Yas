#!/usr/bin/env bash
# Valida que toda migracion con `create table` traiga user_id + RLS + policy con auth.uid()=user_id
# en el mismo archivo. Sale 1 si alguna tabla queda sin proteger.
# Uso: bash validate_rls.sh <archivo.sql> [<archivo2.sql> ...]

set -u
status=0

if [ "$#" -eq 0 ]; then
  echo "uso: bash validate_rls.sh <archivo.sql> [...]" >&2
  exit 2
fi

for f in "$@"; do
  if [ ! -f "$f" ]; then
    echo "SKIP  $f (no existe)"
    continue
  fi

  lc="$(tr '[:upper:]' '[:lower:]' < "$f")"

  tables="$(printf '%s\n' "$lc" \
    | grep -oE 'create table (if not exists )?(public\.)?[a-z_][a-z0-9_]*' \
    | sed -E 's/.*create table (if not exists )?(public\.)?//' \
    | sort -u)"

  if [ -z "$tables" ]; then
    echo "OK    $f (sin create table)"
    continue
  fi

  while IFS= read -r t; do
    [ -z "$t" ] && continue
    problems=""
    printf '%s\n' "$lc" | grep -qE "user_id[[:space:]]+uuid"                              || problems="$problems user_id"
    printf '%s\n' "$lc" | grep -qE "alter table (public\.)?$t[^;]*enable row level security" || problems="$problems enable-rls"
    printf '%s\n' "$lc" | grep -qE "create policy[^;]*on (public\.)?$t([^a-z0-9_]|$)"     || problems="$problems policy"
    printf '%s\n' "$lc" | grep -qE "auth\.uid\(\)[[:space:]]*=[[:space:]]*user_id"         || problems="$problems auth.uid()=user_id"

    if [ -z "$problems" ]; then
      echo "OK    $f :: '$t'"
    else
      echo "FALLA $f :: '$t' -> falta:$problems"
      status=1
    fi
  done <<EOF
$tables
EOF
done

exit $status
