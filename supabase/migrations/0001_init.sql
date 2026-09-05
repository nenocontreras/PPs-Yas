-- 0001_init — helpers compartidos por todas las tablas del proyecto.
-- Ver .claude/skills/supabase-rls-schema/SKILL.md

begin;

-- Trigger reutilizable: mantiene updated_at al día en cada UPDATE.
-- `set search_path = ''` evita el warning function_search_path_mutable del
-- linter de Supabase (now() vive en pg_catalog y se resuelve igual).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

commit;
