---
name: new-module
description: Scaffold de un módulo funcional del dashboard (bitácora, tareas, evidencia, calendario, entrevistas, búsqueda) con la estructura de carpetas y convenciones del proyecto. Invocar cuando el usuario pide crear/armar un módulo nuevo bajo src/app/(dashboard)/.
disable-model-invocation: true
---

# Scaffold de módulo del dashboard

Cada módulo funcional vive en su propia carpeta bajo `src/app/(dashboard)/<modulo>/` (`CLAUDE.md`).

## Estructura a generar

```
src/app/(dashboard)/<modulo>/
  page.tsx                 -> Server Component: carga inicial de datos + render de la vista
  <Modulo>View.tsx         -> Client Component: estado de UI, filtros, formularios
  actions.ts               -> Server Actions: create / update / delete (con revalidatePath)
src/lib/<modulo>.ts         -> queries tipadas a Supabase (select), tipos del dominio
supabase/migrations/NNNN_<modulo>.sql  -> tabla(s) del módulo (via skill create-migration)
```

## Reglas

1. **Datos**: toda lectura/escritura pasa por el cliente Supabase con la sesión del usuario. Nada de `service_role`. RLS hace el aislamiento; igual filtrar por `user_id` en las queries por claridad.
2. **Tabla nueva** → usar `create-migration` + `supabase-rls-schema`. No escribir SQL a mano suelto.
3. **Server Actions** para mutaciones (no route handlers), con `revalidatePath` de la ruta del módulo.
4. **Textos visibles en español**; nombres de archivos/componentes/variables en inglés salvo el nombre del módulo (que es del dominio: `bitacora`, `tareas`, `evidencia`, `calendario`, `entrevistas`, `busqueda`).
5. **Mobile-first**: la vista tiene que funcionar bien en pantalla de celular antes que en desktop (target táctil ≥44px, formularios de una columna).
6. **CRUD completo de punta a punta** (crear, ver, editar, borrar) antes de pulir lo visual — es la regla de orden de construcción de `CLAUDE.md`.
7. **Entrevistas**: este módulo es especial, ver skills `confidentiality-guard` y `whisper-transcribe-setup` y `claude-api-summary`. El audio nunca sale del dispositivo.

## Plantillas

Ver `templates/` en esta skill:
- `page.tsx.tmpl`
- `View.tsx.tmpl`
- `actions.ts.tmpl`
- `lib.ts.tmpl`

Reemplazar `__MODULE__` (kebab), `__Module__` (PascalCase), `__module__` (camel), `__tabla__` (snake plural).

## Definition of done

- [ ] Carpeta creada con los 4 archivos base
- [ ] Migración con RLS validada y aplicada
- [ ] Tipos TS regenerados
- [ ] CRUD probado en el navegador, en viewport mobile
- [ ] Enlace agregado a la navegación del layout del dashboard
