/**
 * Optional AI helpers for catalogue search.
 * Uses Vercel AI Gateway when AI_GATEWAY_API_KEY is set, else OPENAI_API_KEY.
 * Never invents products, SKUs, prices, or vehicle fitment.
 */

import { aiSearchEnabled, getAiProviderConfig } from "@/lib/ai-provider";

export type AiQueryExpansion = {
  expandedTerms: string[];
  productType?: string;
  brand?: string;
  notes?: string;
};

export type AiParsedIntent = {
  productType?: string | null;
  attributes?: string[];
  brand?: string | null;
  grade?: string | null;
  clarify?: boolean;
  searchPhrases?: string[];
};

const TIMEOUT_MS = 2500;
const INTRO_TIMEOUT_MS = 2800;
const INTENT_TIMEOUT_MS = 3200;

export { aiSearchEnabled };

async function chatJson(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  timeoutMs: number
): Promise<Record<string, unknown> | null> {
  const cfg = getAiProviderConfig();
  if (!cfg) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

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
        temperature: 0,
        response_format: { type: "json_object" },
        messages,
      }),
    });

    if (!res.ok) {
      console.warn("[search-ai] provider error", res.status);
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
      console.warn("[search-ai] request failed:", (error as Error)?.message);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function composeFindIntroWithAi(opts: {
  query: string;
  locale: "sq" | "en";
  titles: string[];
  expandedTerms?: string[];
}): Promise<string | null> {
  const q = opts.query.trim();
  if (q.length < 2 || opts.titles.length === 0) return null;

  const lang = opts.locale === "en" ? "English" : "Albanian (Kosovo)";
  const parsed = await chatJson(
    [
      {
        role: "system",
        content:
          `You write a single short intro line for an auto-parts shop in Kosovo (${lang}). ` +
          "The shop will show real catalogue products under your line. " +
          "Return JSON { intro: string }. " +
          "Acknowledge what the customer asked for in plain stock-counter language. " +
          "Do NOT invent part numbers, claim vehicle fitment, or name products not in the provided titles. " +
          "Plain text only (no HTML). Max ~90 characters.",
      },
      {
        role: "user",
        content: JSON.stringify({
          query: q,
          catalogueTitles: opts.titles,
          expandedTerms: opts.expandedTerms ?? [],
        }),
      },
    ],
    INTRO_TIMEOUT_MS
  );

  const intro = typeof parsed?.intro === "string" ? parsed.intro.trim() : "";
  if (!intro || intro.length > 160) return null;
  return intro.replace(/<[^>]+>/g, "");
}

export async function expandQueryWithAi(
  query: string
): Promise<AiQueryExpansion | null> {
  const q = query.trim();
  if (q.length < 3 || q.length > 120) return null;

  const parsed = await chatJson(
    [
      {
        role: "system",
        content:
          "You help an automotive spare-parts search engine in Kosovo. " +
          "Given a customer query (Albanian or English, possibly misspelled), " +
          "return JSON with expandedTerms (array of short search phrases / synonyms / corrected spellings), " +
          "optional productType, optional brand. " +
          "Do not invent part numbers, OE numbers, prices, stock, or vehicle fitment. " +
          "Keep expandedTerms to at most 6 short strings.",
      },
      { role: "user", content: q },
    ],
    TIMEOUT_MS
  );

  if (!parsed) return null;

  const expandedTerms = Array.isArray(parsed.expandedTerms)
    ? parsed.expandedTerms
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter((t) => t.length >= 2 && t.length <= 80)
        .slice(0, 6)
    : [];

  if (expandedTerms.length === 0) return null;

  return {
    expandedTerms,
    productType:
      typeof parsed.productType === "string" ? parsed.productType : undefined,
    brand: typeof parsed.brand === "string" ? parsed.brand : undefined,
  };
}

/**
 * Structured intent for vague / descriptive customer queries.
 */
export async function parseIntentWithAi(
  query: string,
  locale: "sq" | "en" = "sq"
): Promise<AiParsedIntent | null> {
  const q = query.trim();
  if (q.length < 4 || q.length > 240) return null;

  const parsed = await chatJson(
    [
      {
        role: "system",
        content:
          "You extract spare-parts search intent for AUTO SHABANI (Kosovo). " +
          "Return JSON only: { productType, attributes, brand, grade, clarify, searchPhrases }. " +
          "productType one of: air_freshener, antifreeze, engine_oil, oil_filter, air_filter, brake_pads, brake_disc, leather_care, interior_cleaner, null. " +
          "attributes: array like scent:strawberry or empty. " +
          "grade: g11|g12|g13|null for coolant. " +
          "searchPhrases: up to 5 catalogue search phrases in Albanian/English. " +
          "clarify=true only if truly ambiguous. Never invent products or fitment.",
      },
      {
        role: "user",
        content: JSON.stringify({ locale, query: q }),
      },
    ],
    INTENT_TIMEOUT_MS
  );

  if (!parsed) return null;

  const attributes = Array.isArray(parsed.attributes)
    ? parsed.attributes
        .filter((a): a is string => typeof a === "string")
        .map((a) => a.trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const searchPhrases = Array.isArray(parsed.searchPhrases)
    ? parsed.searchPhrases
        .filter((a): a is string => typeof a === "string")
        .map((a) => a.trim())
        .filter((a) => a.length >= 2 && a.length <= 80)
        .slice(0, 5)
    : [];

  return {
    productType:
      typeof parsed.productType === "string" ? parsed.productType : null,
    attributes,
    brand: typeof parsed.brand === "string" ? parsed.brand : null,
    grade: typeof parsed.grade === "string" ? parsed.grade : null,
    clarify: Boolean(parsed.clarify),
    searchPhrases,
  };
}
