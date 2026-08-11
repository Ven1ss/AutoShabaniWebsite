# Simplify product fields

Removes:

- `sell_online` — if a product is `in_stock` with a price, it can go in the cart
- `max_qty_per_order` — cart uses a fixed cap (and `stock_qty` when set)

Kept (optional in admin):

- `featured` — homepage highlight (default off)
- `stock_status` — `in_stock` | `on_request` | `out_of_stock` (default `on_request`)
- `stock_qty` — optional count; leave empty if untracked

Automatic (do not enter manually):

- `created_at` / `updated_at`

## Apply

Run `005_simplify_product_fields.sql` in the Supabase SQL editor, then re-run `search_products.sql`.
