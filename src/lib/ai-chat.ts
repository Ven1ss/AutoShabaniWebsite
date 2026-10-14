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
import { rankProductsForQuery, type MatchReason } from "@/lib/search-engine";
import { expandQueryWithSynonyms } from "@/lib/search-synonyms";
import { significantQueryText } from "@/lib/search-normalize";
import {
  detectProductIntent,
  intentSearchQueries,
  passesStrictRelevance,
} from "@/lib/search-intent";
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
    intent?: string | null;
  };
};

const CHAT_TIMEOUT_MS = 12_000;
const MAX_HISTORY = 8;
/** Enough context for the model; UI may show more via ranked list. */
const MAX_CONTEXT_PRODUCTS = 40;
/** Category / general queries should surface every relevant match. */
const MAX_RETURN_PRODUCTS = 48;

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

function toModelContext(product: AiCatalogueProduct, locale: Locale) {
  return {
    id: product.id,
    title: getLocalized(product.name, locale),
    brand: product.brand,
    sku: product.sku,
    code: product.code,
    category: product.category,
    description: getLocalized(product.description, locale).slice(0, 160),
    sellingPrice:
      product.sellingPrice != null && product.sellingPrice > 0
        ? product.sellingPrice
        : null,
    hasInternalCrossRefs: Boolean(product.hiddenReferences?.trim()),
  };
}

function fallbackReply(locale: Locale, count: number): string {
  if (locale === "en") {
    if (count === 0) {
      return "No confident matches in our catalogue. Share an OE/SKU code, brand, or photo on WhatsApp.";
    }
    return count === 1
      ? "Matching product:"
      : `${count} matching products:`;
  }
  if (count === 0) {
    return "Nuk gjeta përputhje të sigurt në katalog. Dërgo kodin OE/SKU, markën ose një foto në WhatsApp.";
  }
  return count === 1
    ? "Produkti që përputhet:"
    : `${count} produkte që përputhen:`;
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
        temperature: 0.1,
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

async function buildSearchQueries(
  userText: string,
  _locale: Locale
): Promise<{ queries: string[]; aiUsed: boolean }> {
  const intent = detectProductIntent(userText);
  const base = [
    ...intentSearchQueries(userText, intent),
    ...expandQueryWithSynonyms(userText),
  ];
  const out = new Set<string>(base.filter(Boolean));
  let aiUsed = false;

  if (aiSearchEnabled()) {
    const expansion = await expandQueryWithAi(userText);
    if (expansion?.expandedTerms?.length) {
      aiUsed = true;
      for (const term of expansion.expandedTerms) {
        out.add(term);
      }
      if (expansion.brand) out.add(expansion.brand);
      if (expansion.productType) out.add(expansion.productType);
    }
  }

  return { queries: [...out].slice(0, 10), aiUsed };
}

/**
 * Optional short reply. Product list is authoritative — model may only
 * reorder ids from the grounded set, never invent.
 */
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
        `You are AUTO SHABANI's spare-parts search assistant (${lang}). ` +
        "Customers already see product cards — keep reply to ONE short line. " +
        "Rules:\n" +
        "- NEVER invent products, prices, SKUs, OE numbers, stock, or vehicle fitment.\n" +
        "- ONLY use product ids from catalogue.\n" +
        "- Prefer relevance order; for category requests include all relevant ids.\n" +
        "- clarifying=true ONLY if the request is truly ambiguous AND catalogue is empty/weak.\n" +
        "- Do not mention hidden references.\n" +
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
    reply: parsed.reply.trim().slice(0, 160),
    productIds,
    clarifying: Boolean(parsed.clarifying) && productIds.length === 0,
    aiUsed: true,
  };
}

type Ranked = {
  product: AiCatalogueProduct;
  score: number;
  reasons: MatchReason[];
};

/**
 * One assistant turn: retrieve from Supabase → strict relevance → public cards.
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
          ? "Type a part name, brand, or OE/SKU code."
          : "Shkruaj emrin e pjesës, markën ose kodin OE/SKU.",
      products: [],
      meta: {
        aiUsed: false,
        clarifying: true,
        resultCount: 0,
        grounded: true,
        intent: null,
      },
    };
  }

  const intent = detectProductIntent(userText);
  const { queries, aiUsed: intentAi } = await buildSearchQueries(
    userText,
    locale
  );

  const focusQuery = significantQueryText(userText) || userText;
  const candidates = await gatherAiCandidates(
    queries.length ? queries : [focusQuery]
  );

  const rankedMap = new Map<string, Ranked>();
  for (const q of [focusQuery, ...queries].slice(0, 8)) {
    const cleaned = significantQueryText(q) || q;
    for (const hit of rankProductsForQuery(candidates, cleaned, locale)) {
      const full =
        candidates.find((c) => c.id === hit.product.id) ??
        ({ ...hit.product, hiddenReferences: "" } as AiCatalogueProduct);
      const prev = rankedMap.get(full.id);
      if (!prev || hit.score > prev.score) {
        rankedMap.set(full.id, {
          product: full,
          score: hit.score,
          reasons: hit.reasons,
        });
      } else if (prev) {
        prev.reasons = [...new Set([...prev.reasons, ...hit.reasons])];
      }
    }
  }

  let ranked = [...rankedMap.values()].sort((a, b) => b.score - a.score);

  ranked = ranked.filter((r) =>
    passesStrictRelevance(r.score, r.reasons, r.product, intent, locale, {
      minScore: intent ? 90 : 120,
    })
  );

  // Category intent: keep every relevant match (sorted)
  const top = ranked
    .slice(0, intent ? MAX_RETURN_PRODUCTS : Math.min(12, MAX_RETURN_PRODUCTS))
    .map((r) => r.product);

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

  if (composed && composed.productIds.length > 0) {
    aiUsed = true;
    clarifying = composed.clarifying;
    // Prefer model order but never drop intent-relevant products it omitted
    const byId = new Map(top.map((p) => [p.id, p]));
    const picked = composed.productIds
      .map((id) => byId.get(id))
      .filter((p): p is AiCatalogueProduct => Boolean(p));
    if (intent) {
      const seen = new Set(picked.map((p) => p.id));
      selected = [...picked, ...top.filter((p) => !seen.has(p.id))];
    } else {
      selected = picked.length ? picked : top;
    }
    reply = composed.reply || fallbackReply(locale, selected.length);
  } else {
    selected = top;
    clarifying = selected.length === 0;
    reply = composed?.reply || fallbackReply(locale, selected.length);
    if (composed) aiUsed = true;
  }

  const products = selected
    .slice(0, MAX_RETURN_PRODUCTS)
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
      intent: intent?.id ?? null,
    },
  };
}
