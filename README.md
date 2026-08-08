# AUTO SHABANI — Car spare parts catalogue

Enquiry-based catalogue for **AUTO SHABANI** (Prishtina, Kosovo). Browse parts, build a list, then send it on WhatsApp / call / email — **no online checkout**.

## Tech stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS** + Framer Motion
- **Supabase** (products, auth, ratings, storage)
- **Geist** fonts (+ Ethnocentric brand face)

## Features

- Catalogue search (incl. private `hidden_references` via secure RPC)
- Brand / category filters, sort, SEO slug URLs
- Product detail with image zoom, related products, ratings
- Enquiry cart → WhatsApp / phone / email
- Albanian + English (cookie + localStorage)
- Admin CMS (`/admin`) for product CRUD + CSV import
- Enquiry order logging (foundation for future checkout)

## Getting started

### Prerequisites

- Node.js 18+
- A Supabase project

### Install

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local` (see below), then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database setup

In the Supabase SQL editor, run in order:

1. `supabase/schema.sql`
2. `supabase/search_products.sql`
3. `supabase/migrations/001_improvements.sql` (profiles, ratings, orders, storage, admin RLS)

Promote an admin user after first magic-link login:

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

### Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=            # optional GA4
SUPABASE_SERVICE_ROLE_KEY=                # optional; admin fallback / server jobs
```

### Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
```

## Project structure

```
src/
├── app/                 # Routes: /, /katalogu, PDP, brand/category, admin, auth, api
├── components/          # UI, catalogue, cart, home, admin
├── context/             # Language, cart, auth
└── lib/                 # products, contact, supabase, ratings, locale
supabase/
├── schema.sql
├── search_products.sql
└── migrations/
```

## Design

- Neutrals: snow / mist / dark (`#F5F5F7`, `#1D1D1F`)
- Accent: signal red `#C8102E`
- Enquiry-first CTAs; Apple-inspired spacing and type scale

## Notes

- `/design-system` is redirected away in production
- Product image hosts are limited to Supabase storage (+ Unsplash for demos)
- Ratings/comments require Supabase Auth (magic link) and migration `001`
