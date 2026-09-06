-- 0006_entrevistas — Módulo de entrevistas (Fase 6).
--
-- CONFIDENCIALIDAD (.claude/skills/confidentiality-guard, regla 2): esta tabla
-- NO tiene —ni puede tener— ninguna columna de audio (audio_path, audio_url,
-- grabacion, etc.). El audio se transcribe 100% en el navegador y nunca se
-- persiste en el servidor. Solo se guarda texto ya revisado y anonimizado por
-- el usuario.

begin;

create table public.entrevistas (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  puesto                   text not null check (char_length(trim(puesto)) > 0),
  area                     text,
  fecha                    date,
  -- duración estimada en minutos
  duracion_estimada        integer check (duracion_estimada is null or (duracion_estimada > 0 and duracion_estimada <= 600)),
  consentimiento_registrado boolean not null default false,
  -- texto transcripto YA editado/anonimizado por el usuario (nunca audio)
  transcripcion            text,
  -- resumen generado por la API de Claude sobre `transcripcion` (asistencia, editable)
  resumen                  text,
  -- {tareas: [], fricciones: [], citas: []} — para la búsqueda de la Fase 7
  temas_detectados         jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index entrevistas_user_id_idx on public.entrevistas (user_id);
create index entrevistas_user_fecha_idx on public.entrevistas (user_id, fecha desc);

alter table public.entrevistas enable row level security;

create policy "entrevistas_select_own" on public.entrevistas
  for select to authenticated using (auth.uid() = user_id);

create policy "entrevistas_insert_own" on public.entrevistas
  for insert to authenticated with check (auth.uid() = user_id);

create policy "entrevistas_update_own" on public.entrevistas
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "entrevistas_delete_own" on public.entrevistas
  for delete to authenticated using (auth.uid() = user_id);

create trigger entrevistas_set_updated_at
  before update on public.entrevistas
  for each row execute function public.set_updated_at();

commit;
