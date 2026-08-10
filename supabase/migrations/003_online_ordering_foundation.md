# Phase A — Online ordering foundation

Adds catalogue fields that decide what customers may put in the cart:

| Column | Meaning |
|--------|---------|
| `sell_online` | Opt-out switch (default `true` for `in_stock`, forced `false` for other statuses on migrate) |
| `stock_qty` | Optional on-hand count (`NULL` = not tracked) |
| `max_qty_per_order` | Per-line quantity cap (default 10) |

## Sellable rule (app)

A product is **sellable online** only when:

1. `selling_price > 0`
2. `stock_status = 'in_stock'`
3. `sell_online = true`
4. `stock_qty` is null or `> 0`

Everything else stays enquire-only (WhatsApp / call / email).

## Apply

Run `003_online_ordering_foundation.sql` in the Supabase SQL editor after `001_improvements.sql`.

Also update `search_products` (see `search_products.sql`) so RPC results include the new columns.
