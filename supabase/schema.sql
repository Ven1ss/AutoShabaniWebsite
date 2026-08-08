-- AUTO SHABANI — clean products table
-- WARNING: this intentionally deletes the old products table and all its data.
-- After this schema, run search_products.sql and migrations/001_improvements.sql
-- pieces that depend on auth (profiles/ratings) if auth is enabled.

create extension if not exists "pgcrypto";

drop view if exists public.product_rating_stats;
drop view if exists public.products_public;
drop table if exists public.enquiry_orders cascade;
drop table if exists public.product_comments cascade;
drop table if exists public.product_ratings cascade;
drop table if exists public.profiles cascade;
drop table if exists public.products cascade;
drop function if exists public.set_updated_at();
drop function if exists public.is_admin();
drop function if exists public.handle_new_user();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_en text,
  sku text not null unique,
  code text unique,
  brand text,
  description text default '',
  description_en text default '',
  category text not null,
  image_url text,
  purchase_price numeric(12, 2) not null check (purchase_price >= 0),
  selling_price numeric(12, 2) not null check (selling_price >= 0),
  hidden_references text default '',
  featured boolean not null default false,
  stock_status text not null default 'on_request'
    check (stock_status in ('in_stock', 'on_request', 'out_of_stock')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_brand_idx on public.products (brand);
create index products_category_idx on public.products (category);
create index products_code_idx on public.products (code);
create index products_slug_idx on public.products (slug);
create index products_featured_idx on public.products (featured) where featured = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

create policy "Public can read products"
  on public.products
  for select
  to anon, authenticated
  using (true);

revoke all on table public.products from anon, authenticated;
grant select (
  id,
  slug,
  name,
  name_en,
  sku,
  code,
  brand,
  description,
  description_en,
  category,
  image_url,
  selling_price,
  featured,
  stock_status,
  created_at,
  updated_at
) on table public.products to anon, authenticated;

create view public.products_public
with (security_invoker = true)
as
select
  id,
  slug,
  name,
  name_en,
  sku,
  code,
  brand,
  description,
  description_en,
  category,
  image_url,
  selling_price,
  featured,
  stock_status,
  created_at,
  updated_at
from public.products;

grant select on table public.products_public to anon, authenticated;
grant select, insert, update, delete on table public.products to service_role;

comment on column public.products.purchase_price is
  'PRIVATE: business cost; never exposed through products_public.';
comment on column public.products.hidden_references is
  'PRIVATE OPTIONAL: supplier/internal references; never exposed through products_public.';

-- After this schema, also run search_products.sql and migrations/001_improvements.sql
-- for auth profiles, ratings, enquiry orders, storage, and admin RLS.
