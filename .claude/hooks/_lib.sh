# Helpers compartidos por los hooks. Se hace `source` de este archivo.
# Lee el JSON del hook desde stdin (ya capturado en $HOOK_JSON por cada script).

# Extrae un campo string simple del JSON del hook. Usa jq si está; si no, sed.
json_get() {
  local key="$1" json="$2"
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$json" | jq -r "$key // empty" 2>/dev/null
  else
    # fallback muy básico: .tool_input.file_path / .tool_input.command / .tool_name
    local leaf="${key##*.}"
    printf '%s' "$json" \
      | tr -d '\n' \
      | sed -n "s/.*\"$leaf\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" \
      | head -n1
  fi
}

# raíz del repo (donde está .claude)
repo_root() {
  local d="$PWD"
  while [ "$d" != "/" ] && [ "$d" != "" ]; do
    [ -d "$d/.claude" ] && { printf '%s' "$d"; return 0; }
    d="$(dirname "$d")"
  done
  printf '%s' "$PWD"
}
