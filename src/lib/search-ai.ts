/**
 * Optional AI helpers for catalogue search / "Gjej pjesën" finder.
 * Never invents products, SKUs, prices, or vehicle fitment.
 * When OPENAI_API_KEY is missing or the call fails, callers fall back
 * to deterministic search / template copy.
 */

export type AiQueryExpansion = {
  expandedTerms: string[];
  productType?: string;
  brand?: string;
  notes?: string;
};

const TIMEOUT_MS = 1800;
const INTRO_TIMEOUT_MS = 2200;

export function aiSearchEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

async function openAiJson(
  messages: { role: "system" | "user"; content: string }[],
  timeoutMs: number
): Promise<Record<string, unknown> | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

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

/**
 * Short shopper-facing intro for the AI finder panel.
 * Must only describe the query + that results below are from our catalogue.
 */
export async function composeFindIntroWithAi(opts: {
  query: string;
  locale: "sq" | "en";
  titles: string[];
  expandedTerms?: string[];
}): Promise<string | null> {
  const q = opts.query.trim();
  if (q.length < 2 || opts.titles.length === 0) return null;

  const lang = opts.locale === "en" ? "English" : "Albanian (Kosovo)";
  const parsed = await openAiJson(
    [
      {
        role: "system",
        content:
          `You write a single short intro line for an auto-parts shop in Kosovo (${lang}). ` +
          "The shop will show real catalogue products under your line. " +
          "Return JSON { intro: string }. " +
          "Acknowledge what the customer asked for in natural language. " +
          "Do NOT invent part numbers, claim vehicle fitment, or name products not in the provided titles. " +
          "Plain text only (no HTML). Max ~90 characters. Examples: " +
          '"filtri i vajit — kjo kemi:" / "oil filter — here’s what we have:".',
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

  const parsed = await openAiJson(
    [
      {
        role: "system",
        content:
          "You help an automotive spare-parts search engine in Kosovo. " +
          "Given a customer query (Albanian or English, possibly misspelled), " +
          "return JSON with expandedTerms (array of short search phrases / synonyms / corrected spellings), " +
          "optional productType, optional brand. " +
          "Do not invent part numbers, OE numbers, prices, stock, or vehicle fitment. " +
          "Do not claim a part fits a vehicle. Keep expandedTerms to at most 6 short strings.",
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
