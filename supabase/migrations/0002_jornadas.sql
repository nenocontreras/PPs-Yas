-- 0002_jornadas — Bitácora de práctica (Fase 3).
-- Una fila por jornada de PPS. Las horas se acumulan hacia el mínimo
-- reglamentario de 130 hs (máx. de referencia 200 hs).

create table public.jornadas (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  fecha              date not null,
  horas              numeric(4, 1) not null check (horas > 0 and horas <= 24),
  tareas_realizadas  text not null check (char_length(trim(tareas_realizadas)) > 0),
  observaciones      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index jornadas_user_id_idx on public.jornadas (user_id);
create index jornadas_user_fecha_idx on public.jornadas (user_id, fecha desc);

alter table public.jornadas enable row level security;

create policy "jornadas_select_own" on public.jornadas
  for select using (auth.uid() = user_id);

create policy "jornadas_insert_own" on public.jornadas
  for insert with check (auth.uid() = user_id);

create policy "jornadas_update_own" on public.jornadas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "jornadas_delete_own" on public.jornadas
  for delete using (auth.uid() = user_id);

create trigger jornadas_set_updated_at
  before update on public.jornadas
  for each row execute function public.set_updated_at();
