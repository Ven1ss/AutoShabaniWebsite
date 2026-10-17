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
  parseIntentWithAi,
} from "@/lib/search-ai";
import { getAiProviderConfig } from "@/lib/ai-provider";
import { matchProductsByEmbedding } from "@/lib/search-embeddings";
import { logSearchEvent } from "@/lib/search-feedback";
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
    eventId?: string | null;
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
    .map((a) => {
      if (a.startsWith("grade:")) return a.replace(/^grade:/i, "G").toUpperCase();
      if (a.startsWith("scent:")) return a.slice("scent:".length);
      return a;
    })
    .join(", ");
  const hasScent = parsed.attributes.some((a) => a.startsWith("scent:"));
  const hasGrade = parsed.attributes.some((a) => a.startsWith("grade:"));
  const retryHintEn = hasGrade
    ? "Try another grade (G12/G13), brand, or OE/SKU code."
    : hasScent
      ? "Try another scent, brand, or OE/SKU code."
      : "Try another brand, size, or OE/SKU code.";
  const retryHintSq = hasGrade
    ? "Provo gradë tjetër (G12/G13), markë, ose kod OE/SKU."
    : hasScent
      ? "Provo aromë tjetër, markë, ose kod OE/SKU."
      : "Provo markë tjetër, madhësi, ose kod OE/SKU.";

  if (locale === "en") {
    if (count === 0) {
      if (parsed.attributes.length && parsed.typeId) {
        return `No catalogue product verifies “${attrHint}” for that type. ${retryHintEn}`;
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
      return `Nuk ka produkt në katalog që konfirmon “${attrHint}” për këtë lloj. ${retryHintSq}`;
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
  const cfg = getAiProviderConfig();
  if (!cfg) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.chatModel,
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
): Promise<{ queries: string[]; aiUsed: boolean; parsed: ParsedQuery }> {
  const out = new Set<string>([
    ...parsed.retrievalQueries,
    ...expandQueryWithSynonyms(userText),
  ]);
  let aiUsed = false;
  let next = parsed;

  if (aiSearchEnabled()) {
    const [expansion, llmIntent] = await Promise.all([
      expandQueryWithAi(userText),
      // Use LLM intent for vague / missing-type queries
      !parsed.typeId || parsed.typeSource === "functional"
        ? parseIntentWithAi(userText)
        : Promise.resolve(null),
    ]);

    if (expansion?.expandedTerms?.length) {
      aiUsed = true;
      for (const term of expansion.expandedTerms) out.add(term);
      if (expansion.brand) out.add(expansion.brand);
      if (expansion.productType) out.add(expansion.productType);
    }

    if (llmIntent) {
      aiUsed = true;
      if (!next.typeId && llmIntent.productType) {
        next = {
          ...next,
          typeId: llmIntent.productType,
          typeSource: "attribute_context",
        };
      }
      if (llmIntent.grade && !next.attributes.includes(`grade:${llmIntent.grade}`)) {
        next = {
          ...next,
          attributes: [...next.attributes, `grade:${llmIntent.grade}`],
        };
      }
      if (llmIntent.attributes?.length) {
        next = {
          ...next,
          attributes: [...new Set([...next.attributes, ...llmIntent.attributes])],
        };
      }
      if (llmIntent.brand && !next.brand) {
        next = { ...next, brand: llmIntent.brand };
      }
      for (const phrase of llmIntent.searchPhrases ?? []) out.add(phrase);
    }
  }

  return { queries: [...out].filter(Boolean).slice(0, 14), aiUsed, parsed: next };
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
  sessionId?: string | null;
  ip?: string | null;
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
        eventId: null,
      },
    };
  }

  const prior = priorFromHistory(history);
  let parsed = parseCustomerQuery(userText, prior);
  const built = await buildSearchQueries(userText, parsed);
  parsed = built.parsed;
  const queries = built.queries;
  const intentAi = built.aiUsed;

  const focusQuery = significantQueryText(userText) || userText;
  const [candidates, semanticHits] = await Promise.all([
    gatherAiCandidates(queries.length ? queries : [focusQuery]),
    matchProductsByEmbedding(userText, { matchCount: 24, minSimilarity: 0.5 }),
  ]);

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

  // Semantic neighbors — still must pass evaluateProduct / attribute gates
  for (const hit of semanticHits) {
    const full = candidates.find((c) => c.id === hit.productId);
    if (!full) continue;
    const boost = Math.round(80 + hit.similarity * 220);
    consider(full, boost, ["description", "name"]);
  }

  // Type-known queries (esp. functional phrases like "liquid that prevents
  // freezing") often share no lexical tokens with product names. Always
  // recall by type/attributes from the catalogue, then merge scores.
  // Skip scent-only false contexts — typeSource attribute_context for grades/leather is OK.
  if (parsed.typeId) {
    const typeBase =
      parsed.typeSource === "functional" || rankedMap.size === 0 ? 180 : 100;
    for (const full of candidates) {
      if (rankedMap.has(full.id) && !parsed.attributes.length) continue;
      consider(full, typeBase, ["category", "description"]);
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

  if (semanticHits.length > 0) aiUsed = true;

  const eventId = await logSearchEvent({
    query: userText,
    locale,
    mode: "ai",
    intent: parsed.typeId,
    attributes: parsed.attributes,
    resultIds: products.map((p) => p.id),
    aiUsed,
    sessionId: opts.sessionId,
    ip: opts.ip,
  });

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
      eventId,
    },
  };
}
