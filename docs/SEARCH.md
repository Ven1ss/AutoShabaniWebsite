# Intelligent product search & parts assistant

Auto Shabani uses a **hybrid** search stack plus an in-site **ChatGPT-style parts assistant**. Exact identifiers stay authoritative. AI is optional for language understanding and never invents products, prices, stock, codes, or vehicle fitment.

## Layers

1. **Exact identifiers** — SKU / internal `code` / digit-heavy references after normalizing spaces and hyphens (`038 109 101 AH` ≡ `038109101AH`). Does not map `0`↔`O`.
2. **Hidden references** — `hidden_references` is searchable in SQL and in server-side AI ranking. It is **never** returned to browsers or shown in the UI.
3. **Full-text + fuzzy** — names (sq/en), brand, description, category; typo tolerance on tokens (edit distance).
4. **Synonyms** — Albanian / English / Kosovo colloquial groups in `src/lib/search-synonyms.ts`, overridable via `SEARCH_SYNONYMS_JSON`.
5. **Intent + attributes** — lexicon in `search-lexicon.ts` (e.g. `leather_care`, `rim_cleaner`, antifreeze grades `g11`/`g12`/`g13`) with word-boundary matching so `sea` ≠ `seats`.
6. **Typos + Albanian terminology** — synonym groups + fuzzy edit-distance on name/brand/description tokens (distance 2 for longer tokens).
7. **Optional LLM** — Vercel AI Gateway (`AI_GATEWAY_API_KEY`) or direct OpenAI (`OPENAI_API_KEY`): structured intent, query expansion, grounded one-line replies.
8. **Optional embeddings** — pgvector `product_embeddings` + `match_products` RPC; merged with lexical hits, still gated by type/attribute verification.
9. **Vehicle picker** — homepage make/model/year/engine scopes the query / WhatsApp ask; fitment is never invented (see migration `009`).
10. **Feedback loop** — `search_events` / `search_feedback`; UI thumbs + product clicks; `GET /api/ai/learning` suggests synonym promotions.

## Ranking

Implemented in `src/lib/search-engine.ts` + `src/lib/ai-chat.ts`. Weight order (simplified):

SKU exact → code / hidden-ref exact → identifier contains → name/brand exact → includes → description/category → synonym boost → fuzzy → featured → semantic similarity boost.

Results below a minimum score are dropped. Attribute gates (scents, grades) require verified catalogue text. Duplicate products are merged.

## Data sources

| Source | Role |
|--------|------|
| `products` via service role (`src/lib/ai-catalogue.ts`) | AI assistant snapshot: name, sku, category, code, selling_price, brand, description, **hidden_references** |
| `products_public` + RPC `search_products` | Public catalogue + SQL candidate retrieval |
| `product_embeddings` + RPC `match_products` | Semantic neighbors (service role) |
| `search_events` / `search_feedback` | Usage logging for learning |
| App synonym file / env JSON | Query expansion |
| AI Gateway or OpenAI (optional) | Intent + grounded chat + embeddings |

There are **no dedicated OE/barcode/fitment columns** today. OE/cross-refs live in `code`, `sku`, or `hidden_references` when imported. Vehicle fitment is **not** invented.

## Security

- `hidden_references` and `purchase_price` are **server-only**.
- AI chat loads them with `SUPABASE_SERVICE_ROLE_KEY` for matching, then strips them before any JSON sent to the browser.
- The model receives public catalogue fields only (plus a boolean `hasInternalCrossRefs` signal — never the raw refs).
- Recommendations must cite real product ids from the retrieved set.
- Embeddings / feedback / learning APIs use the service role; reindex/learning can be gated with `REINDEX_SECRET`.

## APIs

- `GET /api/products/search?q=&locale=sq|en&rich=1&limit=`
- `GET /api/products/suggest?q=&locale=` — autocomplete
- `POST /api/ai/find` — single-shot stock lookup (legacy / chips)
- `POST /api/ai/chat` — conversational AI search
  - Body: `{ messages:[{ role, content }], locale?, sessionId? }`
  - Response: `{ reply, products:[…], meta:{ intent, resultCount, clarifying, grounded, aiUsed, eventId } }`
- `POST /api/ai/feedback` — `{ eventId?, signal: helpful|not_helpful|clicked_product|corrected_query, productId?, sessionId? }`
- `POST /api/ai/reindex` — refresh product embeddings (header `x-reindex-secret` when `REINDEX_SECRET` set)
- `GET /api/ai/learning` — synonym promotion candidates from empty / not-helpful queries

Homepage dual search:
- **Normal** → `/katalogu?q=` (no AI)
- **AI** → spark / “Search with AI” → `/api/ai/chat` with product cards + “Was this helpful?”

### AI understanding layers (`search-understanding.ts`)
1. **Intent** — product type from triggers, functional phrases, or attribute context
2. **Attributes** — scents, coolant grades, etc. must be **verified** in name or description
3. **Retrieval** — synonym + attribute queries ∪ embedding neighbors ∪ catalogue type recall
4. **Relevance** — type + attribute gates; never claim an unverified scent
5. **Completeness** — category / attribute-confirmed sets return matching catalogue rows (capped)

Rate-limited per IP.

## Supabase migrations

1. `supabase/migrations/007_intelligent_search.sql` — SQL matching (descriptions, compact ids, hidden refs)
2. `supabase/migrations/008_ai_embeddings_and_feedback.sql` — pgvector, `product_embeddings`, `match_products`, `search_events`, `search_feedback`

After applying 008, call `POST /api/ai/reindex` (with secret if configured) to populate embeddings.

## Environment

```bash
# Required for AI assistant to read hidden_references / embeddings / feedback
SUPABASE_SERVICE_ROLE_KEY=

# Preferred: Vercel AI Gateway (same Vercel team as the site)
# Do NOT use `npx vercel ai-gateway setup` for the website — that CLI only
# connects local coding agents (Cursor, etc.), not autoshabani.com search.
AI_GATEWAY_API_KEY=
OPENAI_SEARCH_MODEL=openai/gpt-4o-mini
OPENAI_EMBEDDING_MODEL=openai/text-embedding-3-small

# Fallback: direct OpenAI (if you are not using the Gateway)
# OPENAI_API_KEY=
# OPENAI_SEARCH_MODEL=gpt-4o-mini
# OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Optional: protect reindex + learning endpoints
REINDEX_SECRET=

# Optional extra synonym groups: JSON array of string arrays
SEARCH_SYNONYMS_JSON=[["feroda","brake pads"]]
```

### AI Gateway setup (website)

1. Vercel dashboard → **AI Gateway** → **API Keys** → create a key (e.g. `autoshabani-website-search`).
2. Add `AI_GATEWAY_API_KEY` (and optional model env vars) to the Auto Shabani Vercel project → Environment Variables (Production + Preview).
3. Redeploy.
4. For local work: put the same key in `.env.local` (never commit).

Catalogue search works without a key. The assistant still retrieves/ranks from Supabase; replies use template copy when AI is unavailable.

## What works immediately vs later

| Capability | Status |
|------------|--------|
| Exact SKU/code (spaced/hyphenated) | Works after migration 007 |
| Hidden reference matching | Works in RPC + AI catalogue ranking |
| Typo / synonym matching | Works in app ranking |
| Leather care / G11–G13 grades / sea≠seats | Works (lexicon + boundary match) |
| Autocomplete | Works (`/api/products/suggest`) |
| ChatGPT-like parts assistant | Works (`/api/ai/chat` + homepage panel) |
| AI expansion / grounded wording | Needs `AI_GATEWAY_API_KEY` or `OPENAI_API_KEY` |
| Embedding semantic retrieval | Needs migration 008 + reindex + AI key |
| Feedback thumbs / click logging | Works after migration 008 |
| Synonym promotion suggestions | `GET /api/ai/learning` |
| Verified vehicle fitment filter | Needs fitment data (not present) |

## Admin notes

- CSV `hidden_references` remains the place for extra OE/cross-refs until dedicated columns exist.
- Extend synonyms via env JSON without redeploying matcher logic; use `/api/ai/learning` to find candidates from failed queries.
- Set `SUPABASE_SERVICE_ROLE_KEY` and `AI_GATEWAY_API_KEY` in Vercel for production AI search.
- Re-run reindex after large catalogue imports so embeddings stay fresh.
