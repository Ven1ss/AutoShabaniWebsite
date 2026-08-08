-- Catalogue search: match name / sku / code / brand / hidden_references
-- without ever returning purchase_price or hidden_references.
-- Spaces are ignored in both the query and the stored values.
-- Safe to re-run.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to postgres, anon, authenticated, service_role;

create or replace function private.search_products(search_query text)
returns table (
  id uuid,
  name text,
  sku text,
  code text,
  brand text,
  description text,
  category text,
  image_url text,
  selling_price numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q text := regexp_replace(trim(coalesce(search_query, '')), '\s+', '', 'g');
  pattern text;
begin
  if q = '' then
    return query
    select
      p.id,
      p.name,
      p.sku,
      p.code,
      p.brand,
      p.description,
      p.category,
      p.image_url,
      p.selling_price
    from public.products p
    order by p.brand nulls last, p.name;
    return;
  end if;

  pattern := '%' || replace(replace(replace(q, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%';

  return query
  select
    p.id,
    p.name,
    p.sku,
    p.code,
    p.brand,
    p.description,
    p.category,
    p.image_url,
    p.selling_price
  from public.products p
  where
    regexp_replace(p.name, '\s+', '', 'g') ilike pattern escape E'\\'
    or regexp_replace(p.sku, '\s+', '', 'g') ilike pattern escape E'\\'
    or regexp_replace(coalesce(p.code, ''), '\s+', '', 'g') ilike pattern escape E'\\'
    or regexp_replace(coalesce(p.brand, ''), '\s+', '', 'g') ilike pattern escape E'\\'
    or regexp_replace(coalesce(p.hidden_references, ''), '\s+', '', 'g') ilike pattern escape E'\\'
  order by p.brand nulls last, p.name;
end;
$$;

revoke all on function private.search_products(text) from public;
grant execute on function private.search_products(text) to anon, authenticated, service_role;

create or replace function public.search_products(search_query text)
returns table (
  id uuid,
  name text,
  sku text,
  code text,
  brand text,
  description text,
  category text,
  image_url text,
  selling_price numeric
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
  'Catalogue search by name, sku, code, brand, or hidden_references. Spaces are ignored. Never returns purchase_price or hidden_references.';
