-- 0004_eventos — Calendario (Fase 3).
-- Eventos cargados manualmente que se ven en la vista mensual.

begin;

create type public.evento_tipo as enum ('jornada', 'entrega', 'hito', 'otro');

create table public.eventos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  titulo      text not null check (char_length(trim(titulo)) > 0),
  fecha       date not null,
  tipo        public.evento_tipo not null default 'otro',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index eventos_user_id_idx on public.eventos (user_id);
create index eventos_user_fecha_idx on public.eventos (user_id, fecha);

alter table public.eventos enable row level security;

create policy "eventos_select_own" on public.eventos
  for select to authenticated using (auth.uid() = user_id);

create policy "eventos_insert_own" on public.eventos
  for insert to authenticated with check (auth.uid() = user_id);

create policy "eventos_update_own" on public.eventos
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "eventos_delete_own" on public.eventos
  for delete to authenticated using (auth.uid() = user_id);

create trigger eventos_set_updated_at
  before update on public.eventos
  for each row execute function public.set_updated_at();

commit;
