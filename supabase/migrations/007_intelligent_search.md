# 007 — Intelligent product search

Run in the Supabase SQL editor after prior migrations:

1. Paste / run `007_intelligent_search.sql`
2. Or re-run the updated `supabase/search_products.sql` (same function)

**What it does**
- Normalizes identifiers (spaces/hyphens ignored) for SKU / code / references
- Searches descriptions and categories in addition to name/brand/sku/code/hidden_references
- Caps result set size for performance
- Adds helper functions `as_search_compact` / `as_search_ident`

**App side**
- Synonym expansion + fuzzy re-ranking run in Next.js (`src/lib/search-engine.ts`)
- Optional AI query expansion via `OPENAI_API_KEY` (never invents products)
