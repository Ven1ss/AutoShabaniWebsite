# AUTO SHABANI — Car spare parts catalogue

Catalogue + **online ordering** for **AUTO SHABANI** (Prishtina, Kosovo). In-stock products can be ordered for store pickup (pay in store or by card). On-request parts stay enquire-only via WhatsApp.

## Tech stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS** + Framer Motion
- **Supabase** (products, auth, ratings, storage, orders)
- **Stripe Checkout** (optional card payments)
- **Geist** fonts (+ Ethnocentric brand face)

## Features

- Catalogue search, filters, SEO URLs, PDP zoom + ratings
- Sellable-online rules (`in_stock` + price)
- Checkout at `/porosia` (pickup or card)
- Stripe webhook → paid status + stock decrement
- Order success + lookup (`/porosia/sukses`, `/porosia/kerko`)
- Admin product CMS + order fulfillment workflow
- Enquiry cart / WhatsApp fallback for non-sellable items
- Albanian + English

## Getting started

### Prerequisites

- Node.js 18+
- A Supabase project
- Optional: Stripe account, Resend (or order webhook)

### Install

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local`, then `npm run dev`.

### Database setup (order matters)

1. `supabase/schema.sql` (greenfield) **or** existing DB + migrations
2. `supabase/search_products.sql`
3. `supabase/migrations/001_improvements.sql`
4. `supabase/migrations/003_online_ordering_foundation.sql` then re-run `search_products.sql`
5. `supabase/migrations/004_orders.sql`
6. `supabase/migrations/005_simplify_product_fields.sql` then re-run `search_products.sql`

Promote an admin:

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

### Environment

See `.env.example`. For live ordering you need at least:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (order create / webhooks / admin joins)
- `NEXT_PUBLIC_SITE_URL`
- Optional card pay: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (endpoint `/api/webhooks/stripe`)
- Optional email: `RESEND_API_KEY` + `ORDER_FROM_EMAIL`, or `ORDER_WEBHOOK_URL`

### Stripe webhook

Point Stripe to `https://YOUR_DOMAIN/api/webhooks/stripe` for:

- `checkout.session.completed`
- `payment_intent.payment_failed`
- `charge.refunded` (if enabled in webhook handler)

## Ordering flow

1. Customer adds **sellable** products to cart → `/porosia`
2. Enters name / phone / email → **Pay at pickup** or **Pay by card**
3. Server re-prices from DB, creates `orders` + `order_items`, decrements stock when appropriate
4. Pickup: confirmation page + email/webhook
5. Card: Stripe Checkout → webhook marks paid → confirmation
6. Admin advances status: preparing → ready → completed (refund/cancel restocks)

## Scripts

```bash
npm run dev
npm run build
npm test
npm run lint
```

## Notes

- `/design-system` redirected in production
- Product images may come from any https CDN (`next/image` `hostname: "**"`)
- Ratings/comments need Supabase Auth + migration `001`
