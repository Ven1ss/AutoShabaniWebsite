/**
 * Conversational spare-parts assistant grounded in live Supabase catalogue.
 * Never invents products, prices, codes, scents, or fitment.
 * Uses hidden_references only server-side — never returned to clients.
 * Attributes (e.g. strawberry scent) must be verified in name/description.
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
  evaluateProduct,
  parseCustomerQuery,
  type ParsedQuery,
} from "@/lib/search-understanding";
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
  /** confirmed = all requested attributes verified in catalogue text */
  matchConfidence?: "confirmed" | "partial";
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
    attributes?: string[];
  };
};

const CHAT_TIMEOUT_MS = 12_000;
const MAX_HISTORY = 8;
const MAX_CONTEXT_PRODUCTS = 40;
const MAX_RETURN_PRODUCTS = 48;

function toCard(
  product: Product,
  locale: Locale,
  confidence: "confirmed" | "partial" = "confirmed"
): ChatProductCard {
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
    matchConfidence: confidence,
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
    description: getLocalized(product.description, locale).slice(0, 220),
    sellingPrice:
      product.sellingPrice != null && product.sellingPrice > 0
        ? product.sellingPrice
        : null,
    hasInternalCrossRefs: Boolean(product.hiddenReferences?.trim()),
  };
}

function fallbackReply(
  locale: Locale,
  count: number,
  parsed: ParsedQuery,
  partialOffered: boolean
): string {
  const attrHint = parsed.attributes
    .map((a) => a.replace("scent:", ""))
    .join(", ");

  if (locale === "en") {
    if (count === 0) {
      if (parsed.attributes.length && parsed.typeId) {
        return `No catalogue product verifies “${attrHint}” for that type. Try another scent, brand, or OE/SKU code.`;
      }
      if (parsed.typeId === "brake_pads") {
        return "We don’t currently list brake pads in the online catalogue. Send the vehicle make/model or OE code on WhatsApp and we’ll check in the shop.";
      }
      return "No confident matches in our catalogue. Share an OE/SKU code, brand, or photo on WhatsApp.";
    }
    if (partialOffered) {
      return `No exact verified match for “${attrHint}”. Closest related options:`;
    }
    return count === 1
      ? "Matching product:"
      : `${count} matching products:`;
  }

  if (count === 0) {
    if (parsed.attributes.length && parsed.typeId) {
      return `Nuk ka produkt në katalog që konfirmon “${attrHint}” për këtë lloj. Provo aromë tjetër, markë, ose kod OE/SKU.`;
    }
    if (parsed.typeId === "brake_pads") {
      return "Aktualisht nuk kemi feroda të listuara në katalogun online. Dërgo markën/modelin e veturës ose kodin OE në WhatsApp — e kontrollojmë në dyqan.";
    }
    return "Nuk gjeta përputhje të sigurt në katalog. Dërgo kodin OE/SKU, markën ose një foto në WhatsApp.";
  }
  if (partialOffered) {
    return `Nuk ka përputhje të saktë të verifikuar për “${attrHint}”. Alternative të afërta:`;
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
  parsed: ParsedQuery
): Promise<{ queries: string[]; aiUsed: boolean }> {
  const out = new Set<string>([
    ...parsed.retrievalQueries,
    ...expandQueryWithSynonyms(userText),
  ]);
  let aiUsed = false;

  if (aiSearchEnabled()) {
    const expansion = await expandQueryWithAi(userText);
    if (expansion?.expandedTerms?.length) {
      aiUsed = true;
      for (const term of expansion.expandedTerms) out.add(term);
      if (expansion.brand) out.add(expansion.brand);
      if (expansion.productType) out.add(expansion.productType);
    }
  }

  return { queries: [...out].filter(Boolean).slice(0, 14), aiUsed };
}

async function composeGroundedReply(opts: {
  locale: Locale;
  history: ChatMessage[];
  userText: string;
  candidates: AiCatalogueProduct[];
  parsed: ParsedQuery;
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
        "Customers see product cards — keep reply to ONE short line. " +
        "Rules:\n" +
        "- NEVER invent products, prices, SKUs, scents, OE numbers, stock, or fitment.\n" +
        "- ONLY use product ids from catalogue.\n" +
        "- If an attribute (e.g. strawberry) was requested, only recommend products whose name/description evidence it.\n" +
        "- Prefer relevance order; for category requests include all relevant ids.\n" +
        "- clarifying=true ONLY if truly ambiguous AND catalogue empty.\n" +
        "- Do not mention hidden references.\n" +
        "Return JSON: { reply: string, productIds: string[], clarifying: boolean }",
    },
    {
      role: "user",
      content: JSON.stringify({
        conversation: historyLines,
        latestUserMessage: opts.userText,
        parsedIntent: {
          typeId: opts.parsed.typeId,
          attributes: opts.parsed.attributes,
          brand: opts.parsed.brand,
        },
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
    reply: parsed.reply.trim().slice(0, 180),
    productIds,
    clarifying: Boolean(parsed.clarifying) && productIds.length === 0,
    aiUsed: true,
  };
}

type Ranked = {
  product: AiCatalogueProduct;
  score: number;
  reasons: MatchReason[];
  confidence: "confirmed" | "partial";
};

/** Infer prior intent from earlier user messages for refine-in-conversation. */
function priorFromHistory(history: ChatMessage[]): ParsedQuery | null {
  const users = history.filter((m) => m.role === "user");
  if (users.length < 2) return null;
  // Parse all but the latest, keeping the richest type/attrs
  let prior: ParsedQuery | null = null;
  for (const m of users.slice(0, -1)) {
    prior = parseCustomerQuery(m.content, prior);
  }
  return prior;
}

/**
 * One assistant turn: understand → retrieve → verify attributes → public cards.
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
        attributes: [],
      },
    };
  }

  const prior = priorFromHistory(history);
  const parsed = parseCustomerQuery(userText, prior);
  const { queries, aiUsed: intentAi } = await buildSearchQueries(
    userText,
    parsed
  );

  const focusQuery = significantQueryText(userText) || userText;
  const candidates = await gatherAiCandidates(
    queries.length ? queries : [focusQuery]
  );

  const rankedMap = new Map<string, Ranked>();
  const scoreQueries = [
    focusQuery,
    ...parsed.retrievalQueries,
    ...queries,
  ].slice(0, 10);

  function consider(
    full: AiCatalogueProduct,
    baseScore: number,
    baseReasons: MatchReason[]
  ) {
    const ev = evaluateProduct(full, parsed, baseScore, baseReasons, locale);
    if (ev.confidence === "none") return;
    // When attributes are required, only confirmed (verified) matches
    if (parsed.attributes.length > 0 && ev.confidence !== "confirmed") {
      return;
    }
    const prev = rankedMap.get(full.id);
    if (!prev || ev.score > prev.score) {
      rankedMap.set(full.id, {
        product: full,
        score: ev.score,
        reasons: ev.reasons,
        confidence: ev.confidence === "partial" ? "partial" : "confirmed",
      });
    }
  }

  for (const q of scoreQueries) {
    const cleaned = significantQueryText(q) || q;
    for (const hit of rankProductsForQuery(candidates, cleaned, locale)) {
      const full =
        candidates.find((c) => c.id === hit.product.id) ??
        ({ ...hit.product, hiddenReferences: "" } as AiCatalogueProduct);
      consider(full, hit.score, hit.reasons);
    }
  }

  // Functional / type-known queries often share no lexical tokens with product
  // names (e.g. "liquid that prevents freezing"). Scan catalogue by type.
  if (parsed.typeId && rankedMap.size === 0) {
    for (const full of candidates) {
      consider(full, 120, ["category"]);
    }
  } else if (parsed.typeId && parsed.attributes.length > 0) {
    // Also ensure attribute-confirmed products aren't missed by weak RPC recall
    for (const full of candidates) {
      if (rankedMap.has(full.id)) continue;
      consider(full, 100, ["description"]);
    }
  }

  let ranked = [...rankedMap.values()].sort((a, b) => b.score - a.score);

  // Soft score floor — typed intents already filtered by evaluateProduct
  const minScore = parsed.typeId || parsed.attributes.length ? 40 : 120;
  ranked = ranked.filter((r) => r.score >= minScore);

  if (parsed.preferCheaper) {
    ranked = [...ranked].sort((a, b) => {
      const pa = a.product.sellingPrice ?? Number.POSITIVE_INFINITY;
      const pb = b.product.sellingPrice ?? Number.POSITIVE_INFINITY;
      return pa - pb || b.score - a.score;
    });
  }

  const hasTypedIntent = Boolean(parsed.typeId || parsed.attributes.length);
  let top = ranked
    .slice(
      0,
      hasTypedIntent ? MAX_RETURN_PRODUCTS : Math.min(12, MAX_RETURN_PRODUCTS)
    )
    .map((r) => r.product);

  // If attribute query found nothing confirmed, offer type-only as partial
  // alternatives — clearly labeled, never claimed as scent matches.
  let partialOffered = false;
  if (top.length === 0 && parsed.attributes.length && parsed.typeId) {
    const typeOnly = parseCustomerQuery(userText, prior);
    typeOnly.attributes = []; // drop scent requirement for alternatives
    const alts: Ranked[] = [];
    for (const p of candidates) {
      const ev = evaluateProduct(p, typeOnly, 100, ["category"], locale);
      if (ev.confidence === "none") continue;
      alts.push({
        product: p,
        score: ev.score,
        reasons: ev.reasons,
        confidence: "partial",
      });
    }
    alts.sort((a, b) => b.score - a.score);
    if (alts.length) {
      partialOffered = true;
      top = alts.slice(0, 8).map((a) => a.product);
      for (const a of alts.slice(0, 8)) {
        rankedMap.set(a.product.id, a);
      }
    }
  }

  const composed = await composeGroundedReply({
    locale,
    history,
    userText,
    candidates: top,
    parsed,
  });

  let selected: AiCatalogueProduct[] = [];
  let reply: string;
  let clarifying = false;
  let aiUsed = intentAi;

  if (composed && composed.productIds.length > 0) {
    aiUsed = true;
    clarifying = composed.clarifying;
    const byId = new Map(top.map((p) => [p.id, p]));
    const picked = composed.productIds
      .map((id) => byId.get(id))
      .filter((p): p is AiCatalogueProduct => Boolean(p));
    if (hasTypedIntent) {
      const seen = new Set(picked.map((p) => p.id));
      selected = [...picked, ...top.filter((p) => !seen.has(p.id))];
    } else {
      selected = picked.length ? picked : top;
    }
    reply = composed.reply || fallbackReply(locale, selected.length, parsed, partialOffered);
  } else {
    selected = top;
    clarifying = selected.length === 0;
    reply =
      composed?.reply ||
      fallbackReply(locale, selected.length, parsed, partialOffered);
    if (composed) aiUsed = true;
  }

  const confidenceById = new Map(
    [...rankedMap.values()].map((r) => [r.product.id, r.confidence])
  );

  const products = selected
    .slice(0, MAX_RETURN_PRODUCTS)
    .map((p) =>
      toCard(
        toPublicProduct(p),
        locale,
        partialOffered
          ? "partial"
          : confidenceById.get(p.id) ?? "confirmed"
      )
    );

  return {
    reply,
    products,
    meta: {
      aiUsed,
      clarifying,
      resultCount: products.length,
      grounded: true,
      intent: parsed.typeId,
      attributes: parsed.attributes,
    },
  };
}
