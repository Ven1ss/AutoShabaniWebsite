# Intelligent product search & parts assistant

Auto Shabani uses a **hybrid** search stack plus an in-site **ChatGPT-style parts assistant**. Exact identifiers stay authoritative. AI is optional for language understanding and never invents products, prices, stock, codes, or vehicle fitment.

## Layers

1. **Exact identifiers** — SKU / internal `code` / digit-heavy references after normalizing spaces and hyphens (`038 109 101 AH` ≡ `038109101AH`). Does not map `0`↔`O`.
2. **Hidden references** — `hidden_references` is searchable in SQL and in server-side AI ranking. It is **never** returned to browsers or shown in the UI.
3. **Full-text + fuzzy** — names (sq/en), brand, description, category; typo tolerance on tokens (edit distance).
4. **Synonyms** — Albanian / English / Kosovo colloquial groups in `src/lib/search-synonyms.ts`, overridable via `SEARCH_SYNONYMS_JSON`.
5. **Optional AI** — if `OPENAI_API_KEY` is set: query expansion + grounded chat replies. Deterministic search still runs when AI is down.

## Ranking

Implemented in `src/lib/search-engine.ts`. Weight order (simplified):

SKU exact → code / hidden-ref exact → identifier contains → name/brand exact → includes → description/category → synonym boost → fuzzy → featured.

Results below a minimum score are dropped. Duplicate products are merged.

## Data sources

| Source | Role |
|--------|------|
| `products` via service role (`src/lib/ai-catalogue.ts`) | AI assistant snapshot: name, sku, category, code, selling_price, brand, description, **hidden_references** |
| `products_public` + RPC `search_products` | Public catalogue + SQL candidate retrieval (RPC searches hidden refs, does not return them) |
| App synonym file / env JSON | Query expansion |
| OpenAI (optional) | Intent expansion + grounded chat wording |

There are **no dedicated OE/barcode/fitment columns** today. OE/cross-refs live in `code`, `sku`, or `hidden_references` when imported. Vehicle fitment is **not** invented.

## Security

- `hidden_references` and `purchase_price` are **server-only**.
- AI chat loads them with `SUPABASE_SERVICE_ROLE_KEY` for matching, then strips them before any JSON sent to the browser.
- The model receives public catalogue fields only (plus a boolean `hasInternalCrossRefs` signal — never the raw refs).
- Recommendations must cite real product ids from the retrieved set.

## APIs

- `GET /api/products/search?q=&locale=sq|en&rich=1&limit=`
  - Without `rich=1`: product array (backward compatible)
  - With `rich=1`: `{ products, hits[{ id, slug, score, reasons }], meta }`
- `GET /api/products/suggest?q=&locale=` — autocomplete suggestions
- `POST /api/ai/find` — single-shot stock lookup (legacy / chips)
- `POST /api/ai/chat` — **conversational parts assistant**
  - Body: `{ messages:[{ role, content }], locale? }`
  - Response: `{ reply, products:[{ id, title, brand, sku, code, category, description, price, url, image, slug }], meta }`
  - Clarifying questions when ambiguous; WhatsApp handoff in UI when empty

Rate-limited per IP.

## Supabase migration

Run `supabase/migrations/007_intelligent_search.sql` (or re-run `supabase/search_products.sql`) so SQL matching includes descriptions/categories, compact identifiers, and `hidden_references`.

## Environment

```bash
# Required for AI assistant to read hidden_references securely
SUPABASE_SERVICE_ROLE_KEY=

# Optional: richer language understanding + chat replies (server-only)
OPENAI_API_KEY=
OPENAI_SEARCH_MODEL=gpt-4o-mini

# Optional extra synonym groups: JSON array of string arrays
SEARCH_SYNONYMS_JSON=[["feroda","brake pads"]]
```

Catalogue search works without OpenAI. The assistant still retrieves/ranks from Supabase; replies use template copy when the key is missing.

## What works immediately vs later

| Capability | Status |
|------------|--------|
| Exact SKU/code (spaced/hyphenated) | Works after migration 007 |
| Hidden reference matching | Works in RPC + AI catalogue ranking |
| Typo / synonym matching | Works in app ranking now |
| Autocomplete | Works (`/api/products/suggest`) |
| ChatGPT-like parts assistant | Works (`/api/ai/chat` + homepage panel) |
| AI expansion / grounded wording | Needs `OPENAI_API_KEY` |
| Verified vehicle fitment filter | Needs fitment data (not present) |
| Embedding index / pgvector | Not required for current hybrid path |

## Admin notes

- CSV `hidden_references` remains the place for extra OE/cross-refs until dedicated columns exist.
- Extend synonyms via env JSON without redeploying matcher logic.
- Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel so the assistant can rank on hidden refs.
