# Design System — App de Gestión de PPS

Librería de componentes y fundamentos, versionada con el código y sincronizada
al proyecto de Claude Design **"App de Gestión de PPS — Design System"**
(`4dfa92d7-c560-4a2f-8a92-2f4abf549cd3`).

## Cómo está armado

- `_tokens.css` — **fuente canónica** de los design tokens (colores, tipografía,
  espaciado, radios). Alineado con el esqueleto (Tailwind v4, escala slate,
  dark = `prefers-color-scheme`).
- `foundations/*.html` y `components/*.html` — un archivo de preview autocontenido
  por ítem. Cada uno **inlinea una copia** del bloque de tokens para que
  renderice aislado en el panel de Claude Design. Si cambiás `_tokens.css`,
  propagá el cambio a los previews.
- La primera línea de cada preview es un marcador `<!-- @dsCard group="…"
  name="…" subtitle="…" width="…" height="…" -->` que el panel usa para armar
  la grilla de tarjetas.

## Inventario (batch 1)

| Grupo | Ítem | Estado |
|-------|------|--------|
| Fundamentos | Colores, Tipografía, Espaciado y radios | ✅ |
| Componentes | Button | ✅ spec, falta código en `src/components/` |
| Componentes | TextField | ✅ spec, falta código |
| Componentes | AuthCard (login / registro) | ✅ spec, falta código (Fase 2) |
| Componentes | Navigation | ✅ documenta `dashboard-nav.tsx` existente |
| Componentes | ModuleCard | ✅ documenta el placeholder existente |

Pendiente (Fases 3-5): ProgressBar de horas, StatusPill de tareas, EmptyState,
Alert / Toast, celda de Calendario.

## Sincronizar con Claude Design

Con `DesignSync` autorizado (`/design-login` una vez desde una sesión
interactiva):

1. `list_files` / `get_file` sobre el proyecto para armar el diff.
2. `finalize_plan` con los `writes` (y `localDir` = raíz del repo).
3. `write_files` con `localPath` apuntando a cada archivo de `design-system/`.

Las tarjetas se indexan solas desde el marcador `@dsCard` — no hace falta
`register_assets`.

## Relación con el código

Estos previews son la **especificación visual**. La implementación vive en
`src/components/` con Tailwind. El contrato de props de cada componente está en
el bloque `spec` al pie de su preview.
