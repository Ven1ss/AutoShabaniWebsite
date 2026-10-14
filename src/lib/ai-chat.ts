/**
 * Conversational spare-parts assistant grounded in live Supabase catalogue.
 * Never invents products, prices, codes, or fitment.
 * Uses hidden_references only server-side for matching — never returned to clients.
 */

import {
  formatPrice,
  getLocalized,
  type Product,
} from "@/lib/products";
import { productCanonicalPath } from "@/lib/seo";
import {
  gatherAiCandidates,
  toPublicProduct,
  type AiCatalogueProduct,
} from "@/lib/ai-catalogue";
import { rankProductsForQuery } from "@/lib/search-engine";
import { expandQueryWithSynonyms } from "@/lib/search-synonyms";
import {
  aiSearchEnabled,
  expandQueryWithAi,
} from "@/lib/search-ai";
import type { Locale } from "@/lib/translations";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatProductCard = {
  id: string;
  title: string;
  brand: string;
  sku: string;
  code: string;
  category: string;
  description: string;
  price: string | null;
  url: string;
  image: string;
  slug: string;
};

export type ChatTurnResponse = {
  reply: string;
  products: ChatProductCard[];
  meta: {
    aiUsed: boolean;
    clarifying: boolean;
    resultCount: number;
    grounded: boolean;
  };
};

const CHAT_TIMEOUT_MS = 12_000;
const MAX_HISTORY = 8;
const MAX_CONTEXT_PRODUCTS = 12;
const MAX_RETURN_PRODUCTS = 6;

function toCard(product: Product, locale: Locale): ChatProductCard {
  const desc = getLocalized(product.description, locale).trim();
  return {
    id: product.id,
    title: getLocalized(product.name, locale),
    brand: product.brand,
    sku: product.sku,
    code: product.code,
    category: product.category,
    description: desc.slice(0, 180),
    price:
      product.sellingPrice != null && product.sellingPrice > 0
        ? formatPrice(product.sellingPrice, locale)
        : null,
    url: productCanonicalPath(product.slug),
    image: product.image || "/logo.png",
    slug: product.slug,
  };
}

/** Public catalogue context for the model — no hidden_references / purchase_price. */
function toModelContext(product: AiCatalogueProduct, locale: Locale) {
  return {
    id: product.id,
    title: getLocalized(product.name, locale),
    brand: product.brand,
    sku: product.sku,
    code: product.code,
    category: product.category,
    description: getLocalized(product.description, locale).slice(0, 220),
    sellingPrice:
      product.sellingPrice != null && product.sellingPrice > 0
        ? product.sellingPrice
        : null,
    // Signal only — never the raw hidden_references string
    hasInternalCrossRefs: Boolean(product.hiddenReferences?.trim()),
  };
}

function fallbackReply(
  locale: Locale,
  count: number,
  clarifying: boolean
): string {
  if (locale === "en") {
    if (clarifying) {
      return "I found a few possible matches. Can you share a brand, OE/SKU code, or a clearer part name?";
    }
    if (count === 0) {
      return "I couldn’t find a confident match in our catalogue. Share the OE/SKU code, brand, or a photo on WhatsApp and we’ll check in the shop.";
    }
    return count === 1
      ? "Here’s the closest match from our catalogue:"
      : "Here are the closest matches from our catalogue:";
  }
  if (clarifying) {
    return "Gjeta disa mundësi. A mund të thuash markën, kodin OE/SKU, ose emrin më qartë?";
  }
  if (count === 0) {
    return "Nuk gjeta një përputhje të sigurt në katalog. Dërgo kodin OE/SKU, markën ose një foto në WhatsApp — e kontrollojmë në dyqan.";
  }
  return count === 1
    ? "Ja përputhja më e afërt nga katalogu ynë:"
    : "Ja përputhjet më të afërta nga katalogu ynë:";
}

async function openAiChatJson(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
): Promise<Record<string, unknown> | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  try {
    const model = process.env.OPENAI_SEARCH_MODEL?.trim() || "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages,
      }),
    });
    if (!res.ok) {
      console.warn("[ai-chat] provider error", res.status);
      return null;
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content) as Record<string, unknown>;
  } catch (error) {
    if ((error as Error)?.name !== "AbortError") {
      console.warn("[ai-chat] request failed:", (error as Error)?.message);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Interpret the latest user turn into search queries (AI when available).
 */
async function buildSearchQueries(
  userText: string,
  _locale: Locale
): Promise<{ queries: string[]; aiUsed: boolean }> {
  const base = expandQueryWithSynonyms(userText);
  let aiUsed = false;

  if (aiSearchEnabled()) {
    const expansion = await expandQueryWithAi(userText);
    if (expansion?.expandedTerms?.length) {
      aiUsed = true;
      for (const term of expansion.expandedTerms) {
        if (!base.includes(term)) base.push(term);
      }
      if (expansion.brand && !base.includes(expansion.brand)) {
        base.push(expansion.brand);
      }
      if (expansion.productType && !base.includes(expansion.productType)) {
        base.push(expansion.productType);
      }
    }
  }

  return { queries: base.slice(0, 6), aiUsed };
}

async function composeGroundedReply(opts: {
  locale: Locale;
  history: ChatMessage[];
  userText: string;
  candidates: AiCatalogueProduct[];
}): Promise<{
  reply: string;
  productIds: string[];
  clarifying: boolean;
  aiUsed: boolean;
} | null> {
  if (!aiSearchEnabled() || opts.candidates.length === 0) return null;

  const lang = opts.locale === "en" ? "English" : "Albanian (Kosovo)";
  const catalogue = opts.candidates
    .slice(0, MAX_CONTEXT_PRODUCTS)
    .map((p) => toModelContext(p, opts.locale));

  const historyLines = opts.history
    .slice(-MAX_HISTORY)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const parsed = await openAiChatJson([
    {
      role: "system",
      content:
        `You are AUTO SHABANI's in-site spare-parts assistant (${lang}). ` +
        "You help customers find real products from the provided catalogue JSON only. " +
        "Rules:\n" +
        "- NEVER invent products, prices, SKUs, OE numbers, stock, or vehicle fitment.\n" +
        "- ONLY recommend product ids that appear in catalogue.\n" +
        "- Prefer the best relevance order.\n" +
        "- If ambiguous, ask ONE short clarifying question and still list likely matches if any.\n" +
        "- Do not reveal internal cross-reference strings; hasInternalCrossRefs is a private signal.\n" +
        "- Keep reply concise (2-4 sentences), helpful, parts-counter tone.\n" +
        "Return JSON: { reply: string, productIds: string[], clarifying: boolean }",
    },
    {
      role: "user",
      content: JSON.stringify({
        conversation: historyLines,
        latestUserMessage: opts.userText,
        catalogue,
      }),
    },
  ]);

  if (!parsed || typeof parsed.reply !== "string") return null;

  const allowed = new Set(catalogue.map((c) => c.id));
  const productIds = Array.isArray(parsed.productIds)
    ? parsed.productIds
        .filter((id): id is string => typeof id === "string" && allowed.has(id))
        .slice(0, MAX_RETURN_PRODUCTS)
    : [];

  return {
    reply: parsed.reply.trim().slice(0, 800),
    productIds,
    clarifying: Boolean(parsed.clarifying),
    aiUsed: true,
  };
}

/**
 * One assistant turn: retrieve from Supabase → ground reply → public cards only.
 */
export async function runAiChatTurn(opts: {
  messages: ChatMessage[];
  locale?: Locale;
}): Promise<ChatTurnResponse> {
  const locale = opts.locale ?? "sq";
  const history = opts.messages
    .filter((m) => m.content?.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, 800),
    }));

  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const userText = lastUser?.content?.trim() ?? "";

  if (!userText) {
    return {
      reply:
        locale === "en"
          ? "Tell me the part name, brand, or OE/SKU code and I’ll check our catalogue."
          : "Thuaj emrin e pjesës, markën ose kodin OE/SKU — e kontrolloj në katalog.",
      products: [],
      meta: {
        aiUsed: false,
        clarifying: true,
        resultCount: 0,
        grounded: true,
      },
    };
  }

  const { queries, aiUsed: intentAi } = await buildSearchQueries(
    userText,
    locale
  );

  const candidates = await gatherAiCandidates(
    queries.length ? queries : [userText]
  );

  // Rank across primary query + expansions
  const rankedMap = new Map<
    string,
    { product: AiCatalogueProduct; score: number }
  >();
  for (const q of [userText, ...queries].slice(0, 5)) {
    for (const hit of rankProductsForQuery(candidates, q, locale)) {
      const full =
        candidates.find((c) => c.id === hit.product.id) ??
        ({ ...hit.product, hiddenReferences: "" } as AiCatalogueProduct);
      const prev = rankedMap.get(full.id);
      if (!prev || hit.score > prev.score) {
        rankedMap.set(full.id, { product: full, score: hit.score });
      }
    }
  }

  let ranked = [...rankedMap.values()].sort((a, b) => b.score - a.score);

  // Soft floor for chat — keep likely matches; empty if nothing scored
  const MIN_CHAT_SCORE = 70;
  ranked = ranked.filter((r) => r.score >= MIN_CHAT_SCORE);

  const top = ranked.slice(0, MAX_CONTEXT_PRODUCTS).map((r) => r.product);

  const composed = await composeGroundedReply({
    locale,
    history,
    userText,
    candidates: top,
  });

  let selected: AiCatalogueProduct[] = [];
  let reply: string;
  let clarifying = false;
  let aiUsed = intentAi;

  if (composed) {
    aiUsed = true;
    clarifying = composed.clarifying;
    reply = composed.reply;
    selected = composed.productIds
      .map((id) => top.find((p) => p.id === id))
      .filter((p): p is AiCatalogueProduct => Boolean(p));
    if (selected.length === 0) {
      selected = top.slice(0, MAX_RETURN_PRODUCTS);
    }
  } else {
    selected = top.slice(0, MAX_RETURN_PRODUCTS);
    clarifying = selected.length === 0;
    reply = fallbackReply(locale, selected.length, false);
  }

  // Absolute ground: only real DB products, public fields only
  const products = selected
    .map((p) => toPublicProduct(p))
    .map((p) => toCard(p, locale));

  return {
    reply,
    products,
    meta: {
      aiUsed,
      clarifying,
      resultCount: products.length,
      grounded: true,
    },
  };
}
