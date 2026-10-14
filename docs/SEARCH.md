# Intelligent product search

Auto Shabani uses a **hybrid** search stack. Exact identifiers stay authoritative. AI is optional and never invents products or vehicle fitment.

## Layers

1. **Exact identifiers** — SKU / internal `code` / digit-heavy references after normalizing spaces and hyphens (`038 109 101 AH` ≡ `038109101AH`). Does not map `0`↔`O`.
2. **Full-text + fuzzy** — names (sq/en), brand, description, category; typo tolerance on tokens (edit distance).
3. **Synonyms** — Albanian / English / Kosovo colloquial groups in `src/lib/search-synonyms.ts`, overridable via `SEARCH_SYNONYMS_JSON`.
4. **Optional AI expansion** — if `OPENAI_API_KEY` is set, expands the query into short terms only. Deterministic search still runs when AI is down.

## Ranking

Implemented in `src/lib/search-engine.ts`. Weight order (simplified):

SKU exact → code exact → identifier contains → name/brand exact → includes → description/category → synonym boost → fuzzy → featured.

Results below a minimum score are dropped. Duplicate products are merged.

## Data sources

| Source | Role |
|--------|------|
| `products` + RPC `search_products` | Candidate retrieval (Supabase) |
| `hidden_references` | Searched in SQL, never returned to clients |
| App synonym file / env JSON | Query expansion |
| OpenAI (optional) | Query expansion only |

There are **no dedicated OE/barcode/fitment columns** today. OE/cross-refs live in `code`, `sku`, or `hidden_references` when imported. Vehicle fitment is **not** invented — UI states that fitment is not auto-confirmed.

## APIs

- `GET /api/products/search?q=&locale=sq|en&rich=1&limit=`
  - Without `rich=1`: product array (backward compatible)
  - With `rich=1`: `{ products, hits[{ id, slug, score, reasons }], meta }`
- `GET /api/products/suggest?q=&locale=` — autocomplete suggestions

Rate-limited per IP.

## Supabase migration

Run `supabase/migrations/007_intelligent_search.sql` (or re-run `supabase/search_products.sql`) so SQL matching includes descriptions/categories and compact identifiers.

## Environment

```bash
# Optional AI query expansion (server-only)
OPENAI_API_KEY=
OPENAI_SEARCH_MODEL=gpt-4o-mini

# Optional extra synonym groups: JSON array of string arrays
SEARCH_SYNONYMS_JSON=[["feroda","brake pads"]]
```

Search works fully **without** these keys.

## What works immediately vs later

| Capability | Status |
|------------|--------|
| Exact SKU/code (spaced/hyphenated) | Works after migration 007 |
| Typo / synonym matching | Works in app ranking now |
| Autocomplete | Works (`/api/products/suggest`) |
| AI expansion | Needs `OPENAI_API_KEY` |
| Verified vehicle fitment filter | Needs fitment data (not present) |
| Embedding index / pgvector | Not required for current hybrid path |

## Admin notes

- CSV `hidden_references` remains the place for extra OE/cross-refs until dedicated columns exist.
- Extend synonyms via env JSON without redeploying matcher logic.
