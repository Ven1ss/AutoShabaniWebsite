-- Semantic search embeddings + search feedback loop for AI parts assistant.
-- Requires pgvector. Safe to re-run.

create extension if not exists vector;

create table if not exists public.product_embeddings (
  product_id uuid primary key references public.products (id) on delete cascade,
  embedding vector(1536) not null,
  content_hash text not null,
  updated_at timestamptz not null default now()
);

create index if not exists product_embeddings_embedding_idx
  on public.product_embeddings
  using hnsw (embedding vector_cosine_ops);

create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  locale text not null default 'sq',
  mode text not null default 'ai',
  query text not null,
  intent text,
  attributes text[] not null default '{}',
  result_ids uuid[] not null default '{}',
  result_count integer not null default 0,
  ai_used boolean not null default false,
  session_id text,
  ip_hash text
);

create index if not exists search_events_created_at_idx
  on public.search_events (created_at desc);

create table if not exists public.search_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id uuid references public.search_events (id) on delete set null,
  signal text not null check (signal in ('helpful', 'not_helpful', 'clicked_product', 'corrected_query')),
  product_id uuid references public.products (id) on delete set null,
  note text,
  session_id text
);

create index if not exists search_feedback_event_id_idx
  on public.search_feedback (event_id);

create or replace function public.match_products(
  query_embedding vector(1536),
  match_count integer default 24,
  min_similarity float default 0.55
)
returns table (
  product_id uuid,
  similarity float
)
language sql
stable
as $$
  select
    pe.product_id,
    (1 - (pe.embedding <=> query_embedding))::float as similarity
  from public.product_embeddings pe
  where (1 - (pe.embedding <=> query_embedding)) >= min_similarity
  order by pe.embedding <=> query_embedding
  limit greatest(1, least(coalesce(match_count, 24), 64));
$$;

revoke all on function public.match_products(vector, integer, float) from public;
grant execute on function public.match_products(vector, integer, float) to service_role;

alter table public.product_embeddings enable row level security;
alter table public.search_events enable row level security;
alter table public.search_feedback enable row level security;

-- No public policies: service role only for write/match.
