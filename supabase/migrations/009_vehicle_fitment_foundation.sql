-- Optional vehicle fitment foundation.
-- Safe to apply now; unused until OE/fitment data is imported.
-- Does NOT invent compatibility — empty until filled by admins/imports.

create table if not exists public.vehicle_makes (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_models (
  id text primary key,
  make_id text not null references public.vehicle_makes (id) on delete cascade,
  name text not null,
  year_from integer,
  year_to integer,
  created_at timestamptz not null default now()
);

create index if not exists vehicle_models_make_id_idx
  on public.vehicle_models (make_id);

-- Links a catalogue product to a vehicle application (OE / TecDoc-style later).
create table if not exists public.product_vehicle_fitment (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  make_id text references public.vehicle_makes (id) on delete set null,
  model_id text references public.vehicle_models (id) on delete set null,
  year_from integer,
  year_to integer,
  engine text,
  oe_number text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists product_vehicle_fitment_product_id_idx
  on public.product_vehicle_fitment (product_id);

create index if not exists product_vehicle_fitment_make_model_idx
  on public.product_vehicle_fitment (make_id, model_id);

alter table public.vehicle_makes enable row level security;
alter table public.vehicle_models enable row level security;
alter table public.product_vehicle_fitment enable row level security;

-- Public read for makes/models once populated; fitment stays service-role until curated.
drop policy if exists vehicle_makes_public_read on public.vehicle_makes;
create policy vehicle_makes_public_read
  on public.vehicle_makes for select
  to anon, authenticated
  using (true);

drop policy if exists vehicle_models_public_read on public.vehicle_models;
create policy vehicle_models_public_read
  on public.vehicle_models for select
  to anon, authenticated
  using (true);
