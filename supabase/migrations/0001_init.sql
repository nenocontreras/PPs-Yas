-- 0001_init — helpers compartidos por todas las tablas del proyecto.
-- Ver .claude/skills/supabase-rls-schema/SKILL.md

-- Trigger reutilizable: mantiene updated_at al día en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
