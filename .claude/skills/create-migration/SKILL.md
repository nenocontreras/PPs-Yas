---
name: create-migration
description: Generar una migración SQL nueva para Supabase con las convenciones de RLS del proyecto ya aplicadas y validadas. Invocar cuando el usuario pide "creá una migración", "agregá la tabla X", o cualquier cambio de esquema en Postgres.
disable-model-invocation: true
---

# Crear migración (Supabase + RLS)

## Pasos

1. **Ubicación**: `supabase/migrations/`. Nombre: `<timestamp>_<descripcion_snake_case>.sql` (timestamp `YYYYMMDDHHMMSS`, o el número siguiente si el proyecto ya usa numeración simple).

2. **Contenido**: seguir la plantilla de la skill `supabase-rls-schema`. Para cada `create table` con datos de usuario incluir, en el mismo archivo:
   - `id uuid primary key default gen_random_uuid()`
   - `user_id uuid not null references auth.users(id) on delete cascade`
   - índice por `user_id`
   - `alter table ... enable row level security;`
   - las 4 policies (`select` / `insert` / `update` / `delete`) con `auth.uid() = user_id`
   - trigger `updated_at`

3. **Validar**: correr
   ```
   bash .claude/skills/create-migration/scripts/validate_rls.sh supabase/migrations/<archivo>.sql
   ```
   Si sale con código ≠ 0, corregir la migración antes de continuar. No commitear una migración que no pasa el validador.

4. **Aplicar**: `supabase db push` (o `supabase migration up` local), o vía el MCP de Supabase (`apply_migration`).

5. **Tipos**: regenerar `src/lib/database.types.ts` con `supabase gen types typescript --local` (o el MCP).

6. **Probar aislamiento**: con dos usuarios de prueba, confirmar que B no ve/edita filas de A.

## Notas

- `entrevistas` NO lleva columna de audio ni ruta de audio (`confidentiality-guard`).
- Nunca `drop table` / `drop column` destructivo sin confirmar con el usuario y sin un plan de respaldo.
- La función `set_updated_at()` se crea una sola vez (primera migración); en las siguientes solo el trigger.
