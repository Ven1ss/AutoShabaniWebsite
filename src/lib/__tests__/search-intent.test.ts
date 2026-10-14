import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/products";
import { rankProductsForQuery } from "@/lib/search-engine";
import {
  detectProductIntent,
  passesStrictRelevance,
  productMatchesIntent,
} from "@/lib/search-intent";

function product(
  partial: Partial<Product> & Pick<Product, "id" | "sku" | "name">
): Product {
  return {
    slug: partial.slug ?? partial.id,
    code: partial.code ?? "",
    description: partial.description ?? { sq: "", en: "" },
    brand: partial.brand ?? "",
    category: partial.category ?? "other",
    image: "",
    sellingPrice: partial.sellingPrice ?? 10,
    featured: partial.featured ?? false,
    stockStatus: partial.stockStatus ?? "in_stock",
    stockQty: partial.stockQty ?? null,
    ...partial,
  };
}

const antifreeze = product({
  id: "af1",
  sku: "AF-G12",
  name: { sq: "Antifriz PRIMOIL G12 | 1L", en: "Antifreeze PRIMOIL G12" },
  brand: "PRIMOIL",
  category: "Antifriz",
});

const perfume = product({
  id: "ar1",
  sku: "AROMA1",
  name: { sq: "Arome K2 ROKO LEMON | 20g", en: "Air freshener K2 lemon" },
  brand: "K2",
  category: "Aksesore per veture",
});

const oil = product({
  id: "oil1",
  sku: "OIL1",
  name: { sq: "Vaj 5W-30 LIQUI MOLY", en: "Oil 5W-30 LIQUI MOLY" },
  brand: "LIQUI MOLY",
  category: "Vajra",
});

describe("search intent", () => {
  it("detects antifreeze intent from Albanian colloquial query", () => {
    const intent = detectProductIntent("Antifriz per makin");
    expect(intent?.id).toBe("antifreeze");
  });

  it("matches antifreeze products and rejects air fresheners", () => {
    const intent = detectProductIntent("Antifriz per makin");
    expect(intent).toBeTruthy();
    expect(productMatchesIntent(antifreeze, intent!, "sq")).toBe(true);
    expect(productMatchesIntent(perfume, intent!, "sq")).toBe(false);
    const klimaFresh = product({
      id: "ar2",
      sku: "KLIMA1",
      name: {
        sq: "Arome per klim K2 KLIMA FRESH LEMON | 150ml",
        en: "Cabin freshener",
      },
      brand: "K2",
      category: "Aksesore per veture",
    });
    const radiatorFlush = product({
      id: "rf1",
      sku: "RF1",
      name: {
        sq: "Pastrues i radiatorit K2 RADIATOR FLUSH | 250ml",
        en: "Radiator flush",
      },
      brand: "K2",
      category: "Aksesore per veture",
    });
    expect(productMatchesIntent(klimaFresh, intent!, "sq")).toBe(false);
    expect(productMatchesIntent(radiatorFlush, intent!, "sq")).toBe(false);
  });

  it("ranks antifreeze above perfume and filters perfume out", () => {
    const ranked = rankProductsForQuery(
      [perfume, antifreeze, oil],
      "Antifriz per makin",
      "sq"
    );
    const intent = detectProductIntent("Antifriz per makin");
    const relevant = ranked.filter((h) =>
      passesStrictRelevance(h.score, h.reasons, h.product, intent, "sq")
    );
    expect(relevant.length).toBeGreaterThan(0);
    expect(relevant.every((h) => h.product.id !== "ar1")).toBe(true);
    expect(relevant.some((h) => h.product.id === "af1")).toBe(true);
  });
});
