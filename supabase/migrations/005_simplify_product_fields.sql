-- Simplify product catalogue fields for ordering.
-- Removes sell_online and max_qty_per_order (app uses stock_status + price only).
-- Safe to re-run.

-- Drop dependent view BEFORE dropping columns it references.
drop view if exists public.products_public;

alter table public.products
  drop constraint if exists products_max_qty_per_order_check;

drop index if exists products_sell_online_idx;

alter table public.products
  drop column if exists sell_online,
  drop column if exists max_qty_per_order;

-- Recreate public view without removed columns
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
  stock_qty,
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
  stock_qty,
  created_at,
  updated_at
) on table public.products to anon, authenticated;
