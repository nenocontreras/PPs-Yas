-- 0007_busqueda — Búsqueda semántica (Fase 7).
--
-- pgvector + tabla de fragmentos indexados. Los embeddings se calculan en el
-- navegador (transformers.js, mismo criterio que Whisper): el texto que se
-- indexa es el que el usuario ya generó/anonimizó (resumen de entrevista, notas
-- de bitácora, notas de evidencia). Volumen bajo: se prioriza simple y correcto.

begin;

create extension if not exists vector with schema extensions;

create type public.documento_fuente as enum ('entrevista', 'jornada', 'evidencia');

create table public.documentos_indexados (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  fuente      public.documento_fuente not null,
  fuente_id   uuid not null,
  titulo      text not null,
  contenido   text not null check (char_length(trim(contenido)) > 0),
  embedding   extensions.vector(384) not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, fuente, fuente_id)
);

create index documentos_indexados_user_id_idx on public.documentos_indexados (user_id);
create index documentos_indexados_embedding_idx
  on public.documentos_indexados
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.documentos_indexados enable row level security;

create policy "documentos_indexados_select_own" on public.documentos_indexados
  for select to authenticated using (auth.uid() = user_id);

create policy "documentos_indexados_insert_own" on public.documentos_indexados
  for insert to authenticated with check (auth.uid() = user_id);

create policy "documentos_indexados_update_own" on public.documentos_indexados
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "documentos_indexados_delete_own" on public.documentos_indexados
  for delete to authenticated using (auth.uid() = user_id);

create trigger documentos_indexados_set_updated_at
  before update on public.documentos_indexados
  for each row execute function public.set_updated_at();

-- Búsqueda: filtra por dueño de forma explícita ADEMÁS de RLS (regla 8 de
-- supabase-rls-schema). `stable`, `security invoker` y search_path fijo.
create or replace function public.match_documentos(
  query_embedding extensions.vector(384),
  match_count integer default 8
)
returns table (
  id uuid,
  fuente public.documento_fuente,
  fuente_id uuid,
  titulo text,
  contenido text,
  similitud double precision
)
language sql
stable
security invoker
set search_path = extensions, public, pg_temp
as $$
  select
    d.id,
    d.fuente,
    d.fuente_id,
    d.titulo,
    d.contenido,
    1 - (d.embedding <=> query_embedding) as similitud
  from public.documentos_indexados d
  where d.user_id = (select auth.uid())
  order by d.embedding <=> query_embedding
  limit greatest(1, least(match_count, 50));
$$;

commit;
