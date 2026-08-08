-- Additive improvements for AUTO SHABANI (safe to re-run where noted).
-- Run after schema.sql + search_products.sql on existing projects.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Products: SEO slug, bilingual fields, featured, stock, timestamps
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists slug text,
  add column if not exists name_en text,
  add column if not exists description_en text,
  add column if not exists featured boolean not null default false,
  add column if not exists stock_status text not null default 'on_request',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.products
set slug = lower(regexp_replace(coalesce(sku, id::text), '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null or slug = '';

update public.products
set name_en = coalesce(nullif(name_en, ''), name)
where name_en is null or name_en = '';

update public.products
set description_en = coalesce(nullif(description_en, ''), description, '')
where description_en is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_slug_key'
  ) then
    alter table public.products add constraint products_slug_key unique (slug);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'products_stock_status_check'
  ) then
    alter table public.products
      add constraint products_stock_status_check
      check (stock_status in ('in_stock', 'on_request', 'out_of_stock'));
  end if;
end $$;

create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_featured_idx on public.products (featured) where featured = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Recreate public view with new columns
drop view if exists public.products_public;
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

-- ---------------------------------------------------------------------------
-- Profiles + admin role
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own non-admin fields" on public.profiles;
create policy "Users can update own non-admin fields"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid()));

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

-- Admin write policies on products
drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using (public.is_admin());

grant insert, update, delete on table public.products to authenticated;

-- ---------------------------------------------------------------------------
-- Ratings + comments
-- ---------------------------------------------------------------------------
create table if not exists public.product_ratings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create table if not exists public.product_comments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 2 and 2000),
  author_name text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_ratings_product_idx on public.product_ratings (product_id);
create index if not exists product_comments_product_idx on public.product_comments (product_id);

alter table public.product_ratings enable row level security;
alter table public.product_comments enable row level security;

drop policy if exists "Anyone can read ratings" on public.product_ratings;
create policy "Anyone can read ratings"
  on public.product_ratings for select
  to anon, authenticated
  using (true);

drop policy if exists "Users manage own ratings" on public.product_ratings;
create policy "Users manage own ratings"
  on public.product_ratings for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own ratings" on public.product_ratings;
create policy "Users update own ratings"
  on public.product_ratings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Public reads approved comments" on public.product_comments;
create policy "Public reads approved comments"
  on public.product_comments for select
  to anon, authenticated
  using (approved = true or auth.uid() = user_id or public.is_admin());

drop policy if exists "Users insert comments" on public.product_comments;
create policy "Users insert comments"
  on public.product_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Admins moderate comments" on public.product_comments;
create policy "Admins moderate comments"
  on public.product_comments for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on table public.product_ratings to anon, authenticated;
grant insert, update on table public.product_ratings to authenticated;
grant select on table public.product_comments to anon, authenticated;
grant insert on table public.product_comments to authenticated;
grant update on table public.product_comments to authenticated;
grant select, insert, update, delete on table public.product_ratings to service_role;
grant select, insert, update, delete on table public.product_comments to service_role;

create or replace view public.product_rating_stats
with (security_invoker = true)
as
select
  product_id,
  round(avg(rating)::numeric, 1) as average,
  count(*)::int as count
from public.product_ratings
group by product_id;

grant select on table public.product_rating_stats to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enquiry orders (Phase 5 foundation — no payment)
-- ---------------------------------------------------------------------------
create table if not exists public.enquiry_orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'submitted'
    check (status in ('submitted', 'contacted', 'fulfilled', 'cancelled')),
  locale text not null default 'sq',
  customer_name text,
  customer_phone text,
  customer_email text,
  channel text not null default 'whatsapp'
    check (channel in ('whatsapp', 'email', 'phone', 'web')),
  message text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2),
  created_at timestamptz not null default now()
);

alter table public.enquiry_orders enable row level security;

drop policy if exists "Admins read enquiry orders" on public.enquiry_orders;
create policy "Admins read enquiry orders"
  on public.enquiry_orders for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Anyone can submit enquiry orders" on public.enquiry_orders;
create policy "Anyone can submit enquiry orders"
  on public.enquiry_orders for insert
  to anon, authenticated
  with check (true);

grant insert on table public.enquiry_orders to anon, authenticated;
grant select on table public.enquiry_orders to authenticated;
grant select, insert, update, delete on table public.enquiry_orders to service_role;

-- ---------------------------------------------------------------------------
-- Storage bucket for product images (admin uploads)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
