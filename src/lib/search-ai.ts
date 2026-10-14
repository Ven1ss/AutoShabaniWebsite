/**
 * Optional AI query expansion — never invents products.
 * When OPENAI_API_KEY is missing or the call fails, returns null and
 * deterministic search continues unchanged.
 */

export type AiQueryExpansion = {
  expandedTerms: string[];
  productType?: string;
  brand?: string;
  notes?: string;
};

const TIMEOUT_MS = 1800;

export function aiSearchEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function expandQueryWithAi(
  query: string
): Promise<AiQueryExpansion | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const q = query.trim();
  if (q.length < 3 || q.length > 120) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
        messages: [
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

    const parsed = JSON.parse(content) as {
      expandedTerms?: unknown;
      productType?: unknown;
      brand?: unknown;
    };

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
  } catch (error) {
    if ((error as Error)?.name !== "AbortError") {
      console.warn("[search-ai] expansion failed:", (error as Error)?.message);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}
