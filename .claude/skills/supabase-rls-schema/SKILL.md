---
name: supabase-rls-schema
description: Usar SIEMPRE que se cree o modifique una tabla, vista, bucket de Storage o función en Postgres/Supabase para este proyecto. Define las convenciones de esquema y Row Level Security obligatorias — ninguna tabla con datos de usuario se crea sin su policy en el mismo commit.
---

# Convenciones de esquema + RLS (Supabase / Postgres)

Regla base del proyecto (`CLAUDE.md`): **toda tabla nueva con datos de usuario nace con `user_id` + RLS habilitado + policy `auth.uid() = user_id`, en el mismo commit que la crea.** Nunca en un commit posterior.

## Plantilla obligatoria para toda tabla nueva

```sql
create table public.<nombre_plural> (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- ... columnas del dominio ...
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- índice para las consultas filtradas por dueño (todas lo estarán)
create index <nombre_plural>_user_id_idx on public.<nombre_plural> (user_id);

-- RLS: en el MISMO archivo/commit que el create table
alter table public.<nombre_plural> enable row level security;

create policy "<nombre_plural>_select_own"
  on public.<nombre_plural> for select
  using (auth.uid() = user_id);

create policy "<nombre_plural>_insert_own"
  on public.<nombre_plural> for insert
  with check (auth.uid() = user_id);

create policy "<nombre_plural>_update_own"
  on public.<nombre_plural> for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "<nombre_plural>_delete_own"
  on public.<nombre_plural> for delete
  using (auth.uid() = user_id);

-- trigger updated_at
create trigger <nombre_plural>_set_updated_at
  before update on public.<nombre_plural>
  for each row execute function public.set_updated_at();
```

Función `set_updated_at` (crear una sola vez, en la primera migración):

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
```

## Reglas

1. **PK**: siempre `uuid` con `default gen_random_uuid()`. Nunca `serial` / `bigint identity`.
2. **`user_id uuid not null references auth.users(id)`** en toda tabla de datos de usuario, aunque hoy haya un solo usuario. `on delete cascade` salvo que haya razón para conservar el dato.
3. **RLS**: `enable row level security` + las 4 policies (select/insert/update/delete) en el mismo archivo. Insert y update llevan `with check`.
4. **Nombres**: tablas en `snake_case` plural y en español del dominio (`jornadas`, `tareas`, `eventos`, `evidencia`, `entrevistas`, `documentos_indexados`). Columnas en `snake_case`.
5. **Sin `service_role` en el cliente**. El cliente usa la `anon key` + sesión del usuario; RLS hace cumplir el aislamiento. El `service_role` solo en scripts server-side controlados, nunca expuesto al browser.
6. **Storage**: buckets privados. Policies sobre `storage.objects` con `(storage.foldername(name))[1] = auth.uid()::text` o columna equivalente, mismo criterio de dueño.
7. **`entrevistas`**: NO lleva columna de audio (ver `confidentiality-guard`). Sí: `puesto`, `area`, `fecha`, `duracion_estimada`, `consentimiento_registrado boolean`, `transcripcion text`, `resumen text`, `temas_detectados jsonb`.
8. **pgvector** (`documentos_indexados`): `embedding vector(<dim>)`, índice `ivfflat`/`hnsw`, y la función de búsqueda semántica lleva `where user_id = auth.uid()` explícito además de RLS.

## Migraciones

- Una migración por cambio, numerada (`supabase/migrations/NNNN_descripcion.sql`).
- Usar la skill `create-migration` para generarlas — corre `scripts/validate_rls.sh` y falla si un `create table` no tiene su `enable row level security` + policy en el mismo archivo.
- Regenerar tipos TS tras cada migración: `supabase gen types typescript` (o el MCP de Supabase).

## Definition of done de una tabla nueva

- [ ] PK uuid `gen_random_uuid()`
- [ ] `user_id uuid not null references auth.users(id)`
- [ ] índice por `user_id`
- [ ] `enable row level security`
- [ ] 4 policies con `auth.uid() = user_id` (insert/update con `with check`)
- [ ] trigger `updated_at`
- [ ] tipos TS regenerados
- [ ] probado: usuario B no ve filas de usuario A
