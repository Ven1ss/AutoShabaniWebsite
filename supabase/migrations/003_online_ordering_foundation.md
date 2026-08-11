# Online ordering foundation (Phase A)

Adds optional catalogue fields. Later simplified by **`005_simplify_product_fields.sql`** (removes `sell_online` / `max_qty_per_order`).

## Sellable rule (current app)

A product can go in the cart when:

1. `selling_price > 0`
2. `stock_status = 'in_stock'`
3. `stock_qty` is null or `> 0`

## Optional fields when adding a product

| Field | Meaning |
|--------|---------|
| `featured` | Homepage highlight (default off) |
| `stock_status` | `in_stock` / `on_request` / `out_of_stock` (default `on_request`) |
| `stock_qty` | Optional count; leave empty if untracked |

Automatic: `created_at`, `updated_at` — do not set manually.

## Apply

1. Run `003_online_ordering_foundation.sql` (adds stock columns if missing).
2. Re-run `search_products.sql`.
3. Run `004_orders.sql` for checkout.
4. Run `005_simplify_product_fields.sql`, then re-run `search_products.sql`.
