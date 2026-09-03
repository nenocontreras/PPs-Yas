# Canvas — exports de Claude Design

Artboards de alta fidelidad exportados del proyecto de Claude Design
**"PPS App: Sistema de diseño"** (`31146ba6-7ea7-41d6-9bdb-2f50249e60a0`).
Son la **especificación visual** de las pantallas; la implementación va en
`src/` con Tailwind contra estos diseños.

| Archivo | Contiene |
|---------|----------|
| `Flujo de Autenticacion.dc.html` | Login (default / error / dark / desktop 1280), Registro, "Olvidé mi contraseña", "Revisá tu email" — mobile 390×844 |
| `Inicio y Shell.dc.html` | Panel de progreso (con datos / cuenta nueva vacía / desktop), shell mobile con menú "Más" + logout, shell desktop con sidebar + logout al pie |
| `Componentes Nuevos.dc.html` | ProgressBar de horas, StatusPill de tareas, EmptyState, Alert/Toast, celda de Calendario |
| `support.js` | Runtime del canvas de Claude Design (generado, no editar). Necesario para que los `.dc.html` rendericen. |

## Cómo verlos

- **En Claude Design**: abrir el proyecto `31146ba6…` (es donde se siguen editando).
- **Local**: abrir cualquier `.dc.html` en el navegador — `support.js` monta los
  artboards (descarga React/Babel de unpkg on-demand, así que la primera carga
  necesita conexión).

## Datos de ejemplo

Los mockups usan datos ficticios ("Julián Pérez", `julian.perez@alu.ucse.edu.ar`,
"Empresa Demo S.A."). Ninguno es real (principio "código público, datos
privados" / confidentiality-guard).

## Notas de diseño que salieron del canvas

- **Login desktop**: layout partido — panel slate-900 a la izquierda con
  propuesta de valor, form a la derecha (400px).
- **Shell**: en mobile la barra inferior muestra 5 ítems + "Más" (bottom sheet
  con Entrevistas, Búsqueda y **Cerrar sesión** en rojo). En desktop los 7 ítems
  en el sidebar y el logout al pie, debajo del nombre del usuario.
- **Registro**: agrega campo "Nombre completo" y "Email institucional" (label
  distinto al de login) — falta reflejarlo en el componente `AuthCard` y en el
  esquema de `profiles` de la Fase 2.
- **ProgressBar**: vira de `--primary` a `--success` al cruzar 130 hs; el 100%
  visual es 200 hs.
- **Alert informativo** reutiliza el copy de confidencialidad del audio.
