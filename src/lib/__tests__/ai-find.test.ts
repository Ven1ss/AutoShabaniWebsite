import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/products";

/**
 * Unit-level checks for AI finder presentation helpers.
 * Full `runAiFind` needs Supabase; covered via search-engine tests + manual API.
 */
describe("ai finder formatting", () => {
  it("formats prices for sq locale like the Buli-style cards", () => {
    expect(formatPrice(85, "sq")).toBe("85,00 €");
    expect(formatPrice(4, "en")).toBe("€4.00");
  });
});
