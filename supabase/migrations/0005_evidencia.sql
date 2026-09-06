-- 0005_evidencia — Banco de evidencia (Fase 4).
-- Tabla de metadatos + bucket privado de Storage. Los archivos viven en
-- Storage bajo `<user_id>/<archivo>`; la tabla guarda solo la ruta y metadatos.
-- Ver .claude/skills/confidentiality-guard (regla 5: bucket privado, mismo
-- criterio de dueño que las tablas).

begin;

create type public.evidencia_tipo as enum (
  'documento', 'captura', 'nota', 'organigrama', 'otro'
);

create table public.evidencia (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  titulo        text not null check (char_length(trim(titulo)) > 0),
  tipo          public.evidencia_tipo not null default 'otro',
  etiquetas     text[] not null default '{}',
  fecha_captura date,
  notas         text,
  storage_path  text not null,
  mime_type     text,
  size_bytes    bigint check (size_bytes is null or size_bytes >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index evidencia_user_id_idx on public.evidencia (user_id);
create index evidencia_user_tipo_idx on public.evidencia (user_id, tipo);
create index evidencia_etiquetas_idx on public.evidencia using gin (etiquetas);

alter table public.evidencia enable row level security;

create policy "evidencia_select_own" on public.evidencia
  for select to authenticated using (auth.uid() = user_id);

create policy "evidencia_insert_own" on public.evidencia
  for insert to authenticated with check (auth.uid() = user_id);

create policy "evidencia_update_own" on public.evidencia
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "evidencia_delete_own" on public.evidencia
  for delete to authenticated using (auth.uid() = user_id);

create trigger evidencia_set_updated_at
  before update on public.evidencia
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage: bucket PRIVADO. Si este insert falla por permisos, creá el bucket
-- desde el panel (Storage → New bucket → nombre "evidencia", Private) ANTES de
-- correr la migración. `allowed_mime_types` bloquea SVG/HTML (XSS almacenado) y
-- cualquier cosa fuera de imágenes / PDF / Office; el `accept` del <input> no
-- alcanza porque es bypasseable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidencia', 'evidencia', false, 10485760, -- 10 MB
  array[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'application/pdf',
    'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Policies sobre storage.objects: el primer segmento de la ruta es el user_id.
create policy "evidencia_objects_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'evidencia'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "evidencia_objects_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'evidencia'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "evidencia_objects_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'evidencia'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'evidencia'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "evidencia_objects_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'evidencia'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
