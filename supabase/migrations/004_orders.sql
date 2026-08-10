-- Phase B — Online orders (orders, items, events, stock helpers).
-- Safe to re-run. Run after 003_online_ordering_foundation.sql.

create sequence if not exists public.order_number_seq;

create or replace function public.next_order_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n bigint;
  yr text;
begin
  n := nextval('public.order_number_seq');
  yr := to_char(timezone('utc', now()), 'YYYY');
  return 'AS-' || yr || '-' || lpad(n::text, 6, '0');
end;
$$;

revoke all on function public.next_order_number() from public;
grant execute on function public.next_order_number() to service_role;

create or replace function public.decrement_product_stock(
  p_product_id uuid,
  p_qty int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_qty integer;
begin
  if p_qty is null or p_qty < 1 then
    raise exception 'decrement_product_stock: qty must be >= 1';
  end if;

  select stock_qty into current_qty
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'decrement_product_stock: product not found';
  end if;

  -- NULL stock_qty = not tracked; treat as success without change.
  if current_qty is null then
    return true;
  end if;

  if current_qty < p_qty then
    return false;
  end if;

  update public.products
  set stock_qty = current_qty - p_qty,
      stock_status = case
        when current_qty - p_qty <= 0 then 'out_of_stock'
        else stock_status
      end,
      updated_at = now()
  where id = p_product_id;

  return true;
end;
$$;

revoke all on function public.decrement_product_stock(uuid, int) from public;
grant execute on function public.decrement_product_stock(uuid, int) to service_role;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  status text not null default 'pending_payment'
    check (status in (
      'pending_payment',
      'paid',
      'awaiting_pickup',
      'preparing',
      'ready',
      'completed',
      'cancelled',
      'refunded'
    )),
  payment_method text not null
    check (payment_method in ('stripe', 'pickup')),
  payment_status text not null default 'unpaid'
    check (payment_status in (
      'unpaid',
      'paid',
      'failed',
      'refunded',
      'partially_refunded'
    )),
  locale text not null default 'sq',
  currency text not null default 'eur',
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  fulfillment_type text not null default 'pickup',
  notes text,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  total numeric(12, 2) not null check (total >= 0),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_number_idx on public.orders (number);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_stripe_checkout_session_id_idx
  on public.orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  slug text not null,
  sku text not null,
  name_sq text not null,
  name_en text not null,
  brand text,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  qty integer not null check (qty >= 1),
  line_total numeric(12, 2) not null check (line_total >= 0),
  image_url text
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  kind text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_id_idx on public.order_events (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

-- No anon access; admins select/update via is_admin(); service_role full.

drop policy if exists "Admins select orders" on public.orders;
create policy "Admins select orders"
  on public.orders for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins select order items" on public.order_items;
create policy "Admins select order items"
  on public.order_items for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins update order items" on public.order_items;
create policy "Admins update order items"
  on public.order_items for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins select order events" on public.order_events;
create policy "Admins select order events"
  on public.order_events for select
  to authenticated
  using (public.is_admin());

revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
revoke all on table public.order_events from anon, authenticated;

grant select, update on table public.orders to authenticated;
grant select, update on table public.order_items to authenticated;
grant select on table public.order_events to authenticated;

grant select, insert, update, delete on table public.orders to service_role;
grant select, insert, update, delete on table public.order_items to service_role;
grant select, insert, update, delete on table public.order_events to service_role;

comment on table public.orders is
  'Paid / pickup online orders. Written only via service role.';
comment on function public.next_order_number() is
  'Returns AS-YYYY-###### using order_number_seq.';
comment on function public.decrement_product_stock(uuid, int) is
  'Atomically decrements products.stock_qty when tracked; returns false if insufficient.';
