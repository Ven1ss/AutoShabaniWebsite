-- AUTO SHABANI — clean products table
-- WARNING: this intentionally deletes the old products table and all its data.

create extension if not exists "pgcrypto";

drop view if exists public.products_public;
drop table if exists public.products cascade;
drop function if exists public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  code text not null unique,
  brand text not null,
  description text not null default '',
  category text not null,
  image_url text not null,
  purchase_price numeric(12, 2) not null check (purchase_price >= 0),
  selling_price numeric(12, 2) not null check (selling_price >= 0),
  hidden_references text not null default ''
);

create index products_brand_idx on public.products (brand);
create index products_category_idx on public.products (category);
create index products_code_idx on public.products (code);

alter table public.products enable row level security;

-- Public users may read product rows, but only the explicitly granted columns.
create policy "Public can read products"
  on public.products
  for select
  to anon, authenticated
  using (true);

-- Remove all broad table permissions, then grant only non-sensitive columns.
revoke all on table public.products from anon, authenticated;
grant select (
  id,
  name,
  sku,
  code,
  brand,
  description,
  category,
  image_url,
  selling_price
) on table public.products to anon, authenticated;

-- The website queries this public-safe view.
-- security_invoker ensures the caller's RLS and column permissions are enforced.
create view public.products_public
with (security_invoker = true)
as
select
  id,
  name,
  sku,
  code,
  brand,
  description,
  category,
  image_url,
  selling_price
from public.products;

grant select on table public.products_public to anon, authenticated;
grant select, insert, update, delete on table public.products to service_role;

comment on column public.products.purchase_price is
  'PRIVATE: business cost; never exposed through products_public.';
comment on column public.products.hidden_references is
  'PRIVATE: supplier/internal references; never exposed through products_public.';
