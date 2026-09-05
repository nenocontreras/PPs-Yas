-- 0003_tareas — Tareas / objetivos de la PPS (Fase 3).
-- Estado con enum; `bloque` es texto libre para asociar a la Ficha Maestra
-- (ej. "Bloque 3").

create type public.tarea_estado as enum ('pendiente', 'en_curso', 'completada');

create table public.tareas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  titulo       text not null check (char_length(trim(titulo)) > 0),
  descripcion  text,
  estado       public.tarea_estado not null default 'pendiente',
  bloque       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index tareas_user_id_idx on public.tareas (user_id);
create index tareas_user_estado_idx on public.tareas (user_id, estado);

alter table public.tareas enable row level security;

create policy "tareas_select_own" on public.tareas
  for select using (auth.uid() = user_id);

create policy "tareas_insert_own" on public.tareas
  for insert with check (auth.uid() = user_id);

create policy "tareas_update_own" on public.tareas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tareas_delete_own" on public.tareas
  for delete using (auth.uid() = user_id);

create trigger tareas_set_updated_at
  before update on public.tareas
  for each row execute function public.set_updated_at();
