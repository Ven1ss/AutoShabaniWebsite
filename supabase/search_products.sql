-- Catalogue hybrid search (kept in sync with migrations/007_intelligent_search.sql)
-- Spaces / hyphens ignored for identifiers. Never returns purchase_price or hidden_references.
-- Safe to re-run.

create or replace function public.as_search_compact(value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(coalesce(value, ''), '[^a-zA-Z0-9]+', '', 'g'));
$$;

create or replace function public.as_search_ident(value text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(value, ''), '[^a-zA-Z0-9]+', '', 'g'));
$$;

create index if not exists products_search_sku_ident_idx
  on public.products (public.as_search_ident(sku));

create index if not exists products_search_code_ident_idx
  on public.products (public.as_search_ident(code));

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to postgres, anon, authenticated, service_role;

drop function if exists public.search_products(text);
drop function if exists private.search_products(text);

create or replace function private.search_products(search_query text)
returns table (
  id uuid,
  slug text,
  name text,
  name_en text,
  sku text,
  code text,
  brand text,
  description text,
  description_en text,
  category text,
  image_url text,
  selling_price numeric,
  featured boolean,
  stock_status text,
  stock_qty integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  raw text := trim(coalesce(search_query, ''));
  q_compact text := public.as_search_compact(raw);
  q_ident text := public.as_search_ident(raw);
  pattern text;
begin
  if raw = '' or q_compact = '' then
    return query
    select
      p.id, p.slug, p.name, p.name_en, p.sku, p.code, p.brand,
      p.description, p.description_en, p.category, p.image_url,
      p.selling_price, p.featured, p.stock_status, p.stock_qty
    from public.products p
    order by p.featured desc, p.brand nulls last, p.name
    limit 200;
    return;
  end if;

  pattern := '%' || replace(replace(replace(q_compact, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%';

  return query
  select
    p.id, p.slug, p.name, p.name_en, p.sku, p.code, p.brand,
    p.description, p.description_en, p.category, p.image_url,
    p.selling_price, p.featured, p.stock_status, p.stock_qty
  from public.products p
  where
    public.as_search_ident(p.sku) = q_ident
    or public.as_search_ident(coalesce(p.code, '')) = q_ident
    or public.as_search_compact(p.name) ilike pattern escape E'\\'
    or public.as_search_compact(coalesce(p.name_en, '')) ilike pattern escape E'\\'
    or public.as_search_compact(p.sku) ilike pattern escape E'\\'
    or public.as_search_compact(coalesce(p.code, '')) ilike pattern escape E'\\'
    or public.as_search_compact(coalesce(p.brand, '')) ilike pattern escape E'\\'
    or public.as_search_compact(coalesce(p.description, '')) ilike pattern escape E'\\'
    or public.as_search_compact(coalesce(p.description_en, '')) ilike pattern escape E'\\'
    or public.as_search_compact(coalesce(p.category, '')) ilike pattern escape E'\\'
    or public.as_search_compact(coalesce(p.hidden_references, '')) ilike pattern escape E'\\'
    or (
      length(q_ident) >= 5
      and (
        public.as_search_ident(p.sku) like '%' || q_ident || '%'
        or public.as_search_ident(coalesce(p.code, '')) like '%' || q_ident || '%'
        or public.as_search_ident(coalesce(p.hidden_references, '')) like '%' || q_ident || '%'
      )
    )
  order by
    case
      when public.as_search_ident(p.sku) = q_ident then 0
      when public.as_search_ident(coalesce(p.code, '')) = q_ident then 1
      when public.as_search_ident(p.sku) like q_ident || '%' then 2
      when public.as_search_ident(coalesce(p.code, '')) like q_ident || '%' then 3
      when public.as_search_compact(coalesce(p.brand, '')) ilike pattern escape E'\\' then 4
      when public.as_search_compact(p.name) ilike pattern escape E'\\' then 5
      else 6
    end,
    p.featured desc,
    p.brand nulls last,
    p.name
  limit 120;
end;
$$;

revoke all on function private.search_products(text) from public;
grant execute on function private.search_products(text) to anon, authenticated, service_role;

create or replace function public.search_products(search_query text)
returns table (
  id uuid,
  slug text,
  name text,
  name_en text,
  sku text,
  code text,
  brand text,
  description text,
  description_en text,
  category text,
  image_url text,
  selling_price numeric,
  featured boolean,
  stock_status text,
  stock_qty integer
)
language sql
stable
security invoker
set search_path = public, private
as $$
  select * from private.search_products(search_query);
$$;

revoke all on function public.search_products(text) from public;
grant execute on function public.search_products(text) to anon, authenticated, service_role;

comment on function public.search_products(text) is
  'Hybrid catalogue search: compact/identifier matching across name, sku, code, brand, description, category, hidden_references. Never returns purchase_price or hidden_references.';
