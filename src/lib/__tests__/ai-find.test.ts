import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/products";
import { rankProductsForQuery } from "@/lib/search-engine";
import type { Product } from "@/lib/products";

function product(
  partial: Partial<Product> & Pick<Product, "id" | "sku" | "name">
): Product {
  return {
    slug: partial.slug ?? partial.id,
    code: partial.code ?? "",
    description: partial.description ?? { sq: "", en: "" },
    brand: partial.brand ?? "",
    category: partial.category ?? "filters",
    image: "",
    sellingPrice: partial.sellingPrice ?? 10,
    featured: partial.featured ?? false,
    stockStatus: partial.stockStatus ?? "in_stock",
    stockQty: partial.stockQty ?? null,
    ...partial,
  };
}

describe("ai finder formatting", () => {
  it("formats prices for sq locale like the Buli-style cards", () => {
    expect(formatPrice(85, "sq")).toBe("85,00 €");
    expect(formatPrice(4, "en")).toBe("€4.00");
  });
});

describe("ai finder confidence gate", () => {
  const antifreeze = product({
    id: "1",
    sku: "AF1",
    name: { sq: "Antifriz PRIMOIL G11", en: "Antifreeze" },
    brand: "PRIMOIL",
    category: "Antifriz",
  });
  const oil = product({
    id: "2",
    sku: "OIL1",
    name: { sq: "Vaj 5W-30 LIQUI MOLY", en: "Oil 5W-30 LIQUI MOLY" },
    brand: "LIQUI MOLY",
    category: "Vajra",
  });

  it("does not rank antifreeze above a real oil query brand match", () => {
    const ranked = rankProductsForQuery([antifreeze, oil], "LIQUI MOLY", "sq");
    expect(ranked[0]?.product.id).toBe("2");
    expect(ranked[0]!.score).toBeGreaterThanOrEqual(140);
  });

  it("keeps weak natural-language misses below the AI finder threshold", () => {
    const ranked = rankProductsForQuery(
      [antifreeze, oil],
      "filtri vajit golf 7",
      "sq"
    );
    const confident = ranked.filter(
      (h) =>
        h.score >= 140 &&
        h.reasons.some((r) =>
          ["sku", "code", "identifier", "name", "brand"].includes(r)
        )
    );
    expect(confident.length).toBe(0);
  });
});
