# 006 — Allow duplicate SKUs

Run in the Supabase SQL editor after prior migrations:

```sql
-- contents of 006_allow_duplicate_skus.sql
```

**What it does**
- Drops `products_sku_key` unique constraint
- Adds a non-unique `products_sku_idx` for search performance

**App note:** CSV import inserts new rows (no longer upserts on `sku`). Slugs stay unique via a short suffix on create.
