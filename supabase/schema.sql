-- AUTO SHABANI — Supabase products schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).

create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  name_sq text not null,
  name_en text not null,
  description_sq text not null default '',
  description_en text not null default '',
  brand text not null,
  category text not null
    check (
      category in (
        'filters',
        'brakes',
        'engine',
        'belts',
        'bearings',
        'lighting',
        'clutch',
        'suspension'
      )
    ),
  image_url text not null,
  fitment_sq text not null default '',
  fitment_en text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_brand_idx on public.products (brand);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_active_idx on public.products (is_active);

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
  for each row
  execute function public.set_updated_at();

alter table public.products enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);

-- Inserts/updates/deletes: use the Supabase Table Editor (service role).
-- No public write policies — keep catalogue admin in the dashboard.

insert into public.products (
  slug, sku, name_sq, name_en, description_sq, description_en,
  brand, category, image_url, fitment_sq, fitment_en
) values
(
  'mann-oil-filter-w71275',
  'AS-FIL-001',
  'Filtër Vaji MANN-FILTER W 712/75',
  'MANN-FILTER Oil Filter W 712/75',
  'Filtër vaji premium për mbrojtje optimale të motorit. Cilësi OEM e besuar nga punishte profesionale.',
  'Premium oil filter for optimal engine protection. OEM-grade quality trusted by professional workshops.',
  'MANN-FILTER',
  'filters',
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80',
  'Vetura të ndryshme VW / Audi / Škoda (verifikoni me SKU)',
  'Various VW / Audi / Škoda applications (verify with SKU)'
),
(
  'bosch-air-filter-f026400391',
  'AS-FIL-002',
  'Filtër Ajri Bosch F 026 400 391',
  'Bosch Air Filter F 026 400 391',
  'Filtër ajri me kapacitet të lartë filtrimi për performancë të qëndrueshme të motorit.',
  'High-capacity air filter for consistent engine performance and clean intake air.',
  'Bosch',
  'filters',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
  'Aplikime të shumta europiane — kontaktoni për përputhshmëri',
  'Multiple European applications — contact us for fitment'
),
(
  'mahle-cabin-filter-lak182',
  'AS-FIL-003',
  'Filtër Kabine Mahle LAK 182',
  'Mahle Cabin Filter LAK 182',
  'Filtër kabine me karbon aktiv për ajër më të pastër në brendësi të veturës.',
  'Activated-carbon cabin filter for cleaner cabin air and HVAC protection.',
  'Mahle',
  'filters',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'Modele të zgjedhura Mercedes-Benz',
  'Selected Mercedes-Benz models'
),
(
  'brembo-brake-pads-p85075',
  'AS-BRK-001',
  'Pllaka Frenash Brembo P 85 075',
  'Brembo Brake Pads P 85 075',
  'Pllaka frenash me performancë të lartë për ndalim të sigurt dhe të qëndrueshëm.',
  'High-performance brake pads for confident, consistent stopping power.',
  'Brembo',
  'brakes',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
  'Aplikime të zgjedhura BMW',
  'Selected BMW applications'
),
(
  'brembo-brake-disc-09847912',
  'AS-BRK-002',
  'Disk Frenash Brembo 09.B479.11',
  'Brembo Brake Disc 09.B479.11',
  'Disk frenash i ventiluar me toleranca të sakta OEM për zëvendësim të besueshëm.',
  'Ventilated brake disc with OEM-accurate tolerances for reliable replacement.',
  'Brembo',
  'brakes',
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80',
  'Aplikime të zgjedhura VW Group',
  'Selected VW Group applications'
),
(
  'continental-brake-fluid-dot4',
  'AS-BRK-003',
  'Lëng Frenash Continental DOT 4',
  'Continental DOT 4 Brake Fluid',
  'Lëng frenash me pikë vlimi të lartë për sisteme hidraulike moderne.',
  'High boiling-point brake fluid for modern hydraulic braking systems.',
  'Continental',
  'brakes',
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80',
  'Universale për sisteme DOT 4 (kontrolloni specifikimin)',
  'Universal for DOT 4 systems (verify specification)'
),
(
  'denso-spark-plug-ik20',
  'AS-ENG-001',
  'Bujji Denso Iridium IK20',
  'Denso Iridium Spark Plug IK20',
  'Bujji iridium për ndezje të saktë, konsum të ulët dhe jetëgjatësi të lartë.',
  'Iridium spark plug for precise ignition, efficiency, and long service life.',
  'Denso',
  'engine',
  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80',
  'Motorë të ndryshëm benzinë — verifikoni gap-in',
  'Various petrol engines — verify gap and application'
),
(
  'bosch-oxygen-sensor-0258006537',
  'AS-ENG-002',
  'Sensor Oksigjeni Bosch 0 258 006 537',
  'Bosch Oxygen Sensor 0 258 006 537',
  'Sensor lambda OEM për matje të saktë të gazrave dhe performancë optimale.',
  'OEM-grade lambda sensor for accurate exhaust measurement and optimal performance.',
  'Bosch',
  'engine',
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80',
  'Aplikime të zgjedhura europiane',
  'Selected European applications'
),
(
  'mahle-thermostat-th6287',
  'AS-ENG-003',
  'Termostat Mahle TH 6 287',
  'Mahle Thermostat TH 6 287',
  'Termostat me hapje të saktë për temperaturë stabile të motorit.',
  'Precision-opening thermostat for stable engine operating temperature.',
  'Mahle',
  'engine',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
  'Aplikime të zgjedhura VAG',
  'Selected VAG applications'
),
(
  'gates-timing-belt-kit-k015605xs',
  'AS-BLT-001',
  'Kit Rripi Kohor Gates K015605XS',
  'Gates Timing Belt Kit K015605XS',
  'Kit komplet rripi kohor me tensionues për shërbim të besueshëm të motorit.',
  'Complete timing belt kit with tensioners for reliable engine service intervals.',
  'Gates',
  'belts',
  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80',
  'Motorë të zgjedhur 1.6 / 2.0 TDI (verifikoni)',
  'Selected 1.6 / 2.0 TDI engines (verify application)'
),
(
  'gates-serpentine-belt-6pk1195',
  'AS-BLT-002',
  'Rrip Aksesorësh Gates 6PK1195',
  'Gates Serpentine Belt 6PK1195',
  'Rrip aksesorësh me qëndrueshmëri të lartë për ngarkesë të vazhdueshme.',
  'Durable multi-rib serpentine belt engineered for continuous accessory load.',
  'Gates',
  'belts',
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80',
  'Aplikime të shumta — matni gjatësinë / PK',
  'Multiple applications — match length / PK rating'
),
(
  'skf-wheel-bearing-vkba3644',
  'AS-BRG-001',
  'Kushinë Rrote SKF VKBA 3644',
  'SKF Wheel Bearing Kit VKBA 3644',
  'Kit kushine rrote me cilësi OEM për zhurmë të ulët dhe jetëgjatësi.',
  'OEM-quality wheel bearing kit for low noise and long service life.',
  'SKF',
  'bearings',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
  'Aplikime të zgjedhura para / pas',
  'Selected front / rear applications'
),
(
  'skf-timing-belt-tensioner',
  'AS-BRG-002',
  'Tensionues Rripi SKF VKM 11256',
  'SKF Timing Belt Tensioner VKM 11256',
  'Tensionues me kushinë precize për tension të qëndrueshëm të rripit kohor.',
  'Precision tensioner pulley for stable timing-belt tension under load.',
  'SKF',
  'bearings',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'Kompletohet me kit-in e rripit kohor',
  'Pairs with matching timing belt kits'
),
(
  'valeo-headlight-bulb-h7',
  'AS-LGT-001',
  'Llampë Farash Valeo H7 Essential',
  'Valeo H7 Essential Headlight Bulb',
  'Llampë H7 me dritë të qartë dhe jetëgjatësi të besueshme për përdorim ditor.',
  'Clear H7 bulb with reliable service life for everyday driving visibility.',
  'Valeo',
  'lighting',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
  'Fara me bazë H7 (kontrolloni tipin)',
  'H7 base headlamps (verify bulb type)'
),
(
  'bosch-wiper-blades-aerotwin',
  'AS-LGT-002',
  'Fshirëse Xhami Bosch Aerotwin',
  'Bosch Aerotwin Wiper Blades',
  'Fshirëse flat-blade për fshirje të qetë dhe dukshmëri optimale në shi.',
  'Flat-blade wipers for quiet wipe performance and clear wet-weather visibility.',
  'Bosch',
  'lighting',
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80',
  'Çifte sipas gjatësisë së xhamit — specifikoni modelin',
  'Paired by glass length — specify your vehicle'
),
(
  'valeo-clutch-kit-826437',
  'AS-CLT-001',
  'Kit Ambrejazhi Valeo 826437',
  'Valeo Clutch Kit 826437',
  'Kit ambrejazhi me disk, pllakë shtypëse dhe kushinë për riparim të plotë.',
  'Complete clutch kit with disc, pressure plate, and release bearing.',
  'Valeo',
  'clutch',
  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80',
  'Aplikime të zgjedhura manuale',
  'Selected manual transmission applications'
),
(
  'zf-clutch-slave-cylinder',
  'AS-CLT-002',
  'Cilindër Ambrejazhi ZF',
  'ZF Clutch Slave Cylinder',
  'Cilindër hidraulik ambrejazhi për ndërrim të saktë dhe të butë.',
  'Hydraulic clutch slave cylinder for precise, smooth gear engagement.',
  'ZF',
  'clutch',
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80',
  'Sisteme hidraulike ambrejazhi — verifikoni me VIN',
  'Hydraulic clutch systems — verify with VIN'
),
(
  'zf-shock-absorber-front',
  'AS-SUS-001',
  'Amortizator ZF Para',
  'ZF Front Shock Absorber',
  'Amortizator me kontroll të saktë të pezullimit për komfort dhe stabilitet.',
  'Precision-damped shock absorber for comfort and chassis stability.',
  'ZF',
  'suspension',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
  'Aplikime të zgjedhura para — specifikoni modelin',
  'Selected front applications — specify your model'
),
(
  'continental-control-arm-bushing',
  'AS-SUS-002',
  'Bushing Krahu Continental',
  'Continental Control Arm Bushing',
  'Bushing gome-metal për pezullim të qetë dhe gjeometri të saktë të rrotave.',
  'Rubber-metal bushing for quiet suspension and accurate wheel geometry.',
  'Continental',
  'suspension',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'Krahë pezullimi — montim sipas anës',
  'Control arms — side-specific fitment'
),
(
  'denso-ignition-coil',
  'AS-ENG-004',
  'Bobinë Ndezjeje Denso',
  'Denso Ignition Coil',
  'Bobinë ndezjeje me dalje të qëndrueshme për ndezje të besueshme të motorit.',
  'Ignition coil with stable output for reliable spark under load.',
  'Denso',
  'engine',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
  'Motorë me coil-on-plug — verifikoni referencën',
  'Coil-on-plug engines — verify reference number'
)
on conflict (slug) do nothing;
