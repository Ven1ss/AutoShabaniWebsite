-- Online ordering foundation (Phase A).
-- Safe to re-run. Run after 001_improvements.sql.

alter table public.products
  add column if not exists sell_online boolean not null default true,
  add column if not exists stock_qty integer,
  add column if not exists max_qty_per_order integer not null default 10;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_stock_qty_check'
  ) then
    alter table public.products
      add constraint products_stock_qty_check
      check (stock_qty is null or stock_qty >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'products_max_qty_per_order_check'
  ) then
    alter table public.products
      add constraint products_max_qty_per_order_check
      check (max_qty_per_order >= 1 and max_qty_per_order <= 99);
  end if;
end $$;

comment on column public.products.sell_online is
  'When false, product cannot be added to the online cart even if in stock.';
comment on column public.products.stock_qty is
  'Optional on-hand quantity. NULL means quantity is not tracked.';
comment on column public.products.max_qty_per_order is
  'Hard cap per cart line (also clamped by stock_qty when set).';

-- Only explicitly in-stock + sell_online products are cartable; keep on_request as enquire-only.
update public.products
set sell_online = false
where stock_status is distinct from 'in_stock'
  and sell_online is true;

create index if not exists products_sell_online_idx
  on public.products (sell_online)
  where sell_online = true;

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
  sell_online,
  stock_qty,
  max_qty_per_order,
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
  sell_online,
  stock_qty,
  max_qty_per_order,
  created_at,
  updated_at
) on table public.products to anon, authenticated;
