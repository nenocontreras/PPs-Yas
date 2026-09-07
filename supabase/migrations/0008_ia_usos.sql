-- 0008_ia_usos — Registro de uso de la IA de resumen de entrevistas.
--
-- Por qué: en la instancia pública el resumen usa las API keys del servidor
-- (varios proveedores con rotación). Esta tabla es un log append-only que sirve
-- para (a) limitar cuántos resúmenes puede pedir un usuario por día y así evitar
-- que un abuso consuma las cuotas, y (b) ver qué proveedor respondió.
--
-- Es un log: no necesita `updated_at`. Igual nace con RLS y las 4 policies por
-- dueño (convención del proyecto — ver .claude/skills/supabase-rls-schema).

begin;

create table public.ia_usos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  proveedor     text not null check (char_length(trim(proveedor)) > 0),
  -- entrevista sobre la que se pidió el resumen; queda null si se borra
  entrevista_id uuid references public.entrevistas(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index ia_usos_user_id_created_idx on public.ia_usos (user_id, created_at desc);

alter table public.ia_usos enable row level security;

create policy "ia_usos_select_own" on public.ia_usos
  for select to authenticated using (auth.uid() = user_id);

create policy "ia_usos_insert_own" on public.ia_usos
  for insert to authenticated with check (auth.uid() = user_id);

create policy "ia_usos_update_own" on public.ia_usos
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ia_usos_delete_own" on public.ia_usos
  for delete to authenticated using (auth.uid() = user_id);

commit;
