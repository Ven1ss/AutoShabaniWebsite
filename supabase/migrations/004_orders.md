# Phase B — Online orders

Adds real checkout tables and stock helpers for AUTO SHABANI online ordering.

## Tables

| Table | Purpose |
|-------|---------|
| `orders` | Customer order header (status, payment, totals, Stripe ids) |
| `order_items` | Line snapshots (price locked at checkout) |
| `order_events` | Audit trail (`created`, `paid`, `status_changed`, …) |

Order numbers come from `public.next_order_number()` → `AS-YYYY-######`.

## Stock

`public.decrement_product_stock(product_id, qty)`:

- `stock_qty IS NULL` → no-op, returns `true`
- insufficient qty → returns `false`
- otherwise decrements (and marks `out_of_stock` when qty hits 0)

## RLS

- **anon**: no access
- **authenticated admin** (`is_admin()`): select + update on orders/items; select on events
- **service_role**: full access (API routes use this)

## Apply

1. Ensure `003_online_ordering_foundation.sql` has been applied.
2. Run `004_orders.sql` in the Supabase SQL editor (or `supabase db push`).
3. Set env: `SUPABASE_SERVICE_ROLE_KEY`, optional `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ORDER_WEBHOOK_URL`, `ORDER_FROM_EMAIL`.
