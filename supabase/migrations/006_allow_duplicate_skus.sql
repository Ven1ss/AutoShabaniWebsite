-- Allow duplicate product SKUs.
-- Products are identified by id/slug; SKU is a searchable attribute only.
-- Safe to re-run.

alter table public.products
  drop constraint if exists products_sku_key;

-- Keep a non-unique index for catalogue search / admin filters.
create index if not exists products_sku_idx on public.products (sku);
