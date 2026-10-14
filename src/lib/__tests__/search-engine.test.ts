import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/products";
import {
  normalizeIdentifier,
  normalizeText,
  isIdentifierLike,
} from "@/lib/search-normalize";
import { expandQueryWithSynonyms } from "@/lib/search-synonyms";
import { rankProductsForQuery } from "@/lib/search-engine";

function product(partial: Partial<Product> & Pick<Product, "id" | "sku" | "name">): Product {
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

const oilFilter = product({
  id: "1",
  sku: "F026407006",
  code: "038109101AH",
  name: { sq: "Filter i vajit", en: "Oil filter" },
  brand: "MANN",
  category: "filters",
  description: { sq: "Filter vaji OEM", en: "OEM oil filter" },
});

const brakePads = product({
  id: "2",
  sku: "BP-GOLF5",
  code: "1K0698151",
  name: { sq: "Pllakat e frenave", en: "Brake pads" },
  brand: "TRW",
  category: "brakes",
});

const airFilter = product({
  id: "3",
  sku: "AF-100",
  code: "AF100",
  name: { sq: "Filter i ajrit", en: "Air filter" },
  brand: "MANN",
  category: "filters",
});

const catalogue = [oilFilter, brakePads, airFilter];

describe("search normalize", () => {
  it("normalizes identifiers by stripping spaces and hyphens", () => {
    expect(normalizeIdentifier("038 109 101 AH")).toBe("038109101AH");
    expect(normalizeIdentifier("038-109-101-AH")).toBe("038109101AH");
    expect(normalizeIdentifier("038109101AH")).toBe("038109101AH");
  });

  it("does not confuse 0 with O", () => {
    expect(normalizeIdentifier("0IL")).not.toBe(normalizeIdentifier("OIL"));
  });

  it("detects identifier-like tokens", () => {
    expect(isIdentifierLike("038109101AH")).toBe(true);
    expect(isIdentifierLike("filter")).toBe(false);
  });

  it("strips diacritics in text normalize", () => {
    expect(normalizeText("Mbajtëse")).toBe("mbajtese");
  });
});

describe("synonyms", () => {
  it("expands oil filter colloquial terms", () => {
    const expanded = expandQueryWithSynonyms("filtri vajit");
    expect(expanded.some((q) => /oil filter/i.test(q))).toBe(true);
  });

  it("expands feroda to brake pads family", () => {
    const expanded = expandQueryWithSynonyms("feroda");
    expect(expanded.some((q) => /brake pads|pllakat/i.test(q))).toBe(true);
  });
});

describe("rankProductsForQuery", () => {
  it("ranks exact SKU first", () => {
    const ranked = rankProductsForQuery(catalogue, "F026407006", "sq");
    expect(ranked[0]?.product.id).toBe("1");
    expect(ranked[0]?.reasons).toContain("sku");
  });

  it("matches OE/code with spaces", () => {
    const ranked = rankProductsForQuery(catalogue, "038 109 101 AH", "sq");
    expect(ranked[0]?.product.id).toBe("1");
    expect(ranked[0]?.reasons).toContain("code");
  });

  it("matches OE/code with hyphens", () => {
    const ranked = rankProductsForQuery(catalogue, "038-109-101-AH", "sq");
    expect(ranked[0]?.product.id).toBe("1");
  });

  it("finds misspelled Albanian oil filter query via fuzzy/synonym", () => {
    const ranked = rankProductsForQuery(catalogue, "filtri vajit", "sq");
    expect(ranked.some((r) => r.product.id === "1")).toBe(true);
  });

  it("maps feroda synonym to brake pads", () => {
    const ranked = rankProductsForQuery(catalogue, "feroda", "sq");
    expect(ranked[0]?.product.id).toBe("2");
  });

  it("finds English oil filter against Albanian catalogue name via synonym", () => {
    const ranked = rankProductsForQuery(catalogue, "oil filter", "en");
    expect(ranked.some((r) => r.product.id === "1")).toBe(true);
  });

  it("partial name returns relevant filter products", () => {
    const ranked = rankProductsForQuery(catalogue, "filter", "sq");
    const ids = ranked.map((r) => r.product.id);
    expect(ids).toContain("1");
    expect(ids).toContain("3");
    expect(ids).not.toContain("2");
  });

  it("brand + type prioritizes matching brand", () => {
    const ranked = rankProductsForQuery(catalogue, "mann filter", "en");
    expect(ranked[0]?.product.brand).toBe("MANN");
  });

  it("nonexistent part number does not invent an exact match", () => {
    const ranked = rankProductsForQuery(catalogue, "ZZZ999999999", "sq");
    expect(ranked.every((r) => !r.reasons.includes("sku") || r.score < 1000)).toBe(
      true
    );
    expect(ranked.filter((r) => r.reasons.includes("sku") && r.score >= 1000)).toHaveLength(
      0
    );
  });

  it("does not claim fitment — ranking never invents products", () => {
    const ranked = rankProductsForQuery(catalogue, "filtri vajit golf 7", "sq");
    for (const row of ranked) {
      expect(catalogue.some((p) => p.id === row.product.id)).toBe(true);
    }
  });
});
