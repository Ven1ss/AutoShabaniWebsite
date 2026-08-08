# Phase 5 — Checkout foundation (enquiry orders)

Online card checkout is **not** enabled. Instead, cart sends create rows in `enquiry_orders` via `POST /api/enquiry-orders` before opening WhatsApp / email / phone.

## What exists

- Table `public.enquiry_orders` (see `001_improvements.sql`)
- Public insert RLS for anon/authenticated
- Admin read in `/admin` + `GET /api/admin/orders`
- Cart drawer logs each send attempt

## Next steps when you want real checkout

1. Add `orders` + `order_items` with payment provider (Stripe / local)
2. Keep WhatsApp as fallback for complex / out-of-stock parts
3. Do not remove enquiry flow until payments + stock ops are ready
