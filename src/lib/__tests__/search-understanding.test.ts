import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/products";
import {
  evaluateProduct,
  parseCustomerQuery,
  productHasAttribute,
  productMatchesType,
  textHasTerm,
} from "@/lib/search-understanding";

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

const strawberryRoko = product({
  id: "str1",
  sku: "ROKO-STR",
  name: { sq: "Arome K2 ROKO STRAWBERRY 20 G", en: "K2 ROKO STRAWBERRY" },
  brand: "K2",
  category: "Aksesore per veture",
  description: {
    sq: "Varëse aromatizuese për makinën",
    en: "Car air freshener",
  },
  sellingPrice: 2.5,
});

const strawberryDescOnly = product({
  id: "str2",
  sku: "VENTO-STR",
  name: { sq: "Arome K2 VENTO FRUIT 8 ML", en: "K2 VENTO FRUIT" },
  brand: "K2",
  category: "Aksesore per veture",
  description: {
    sq: "Një aromatizues ajri për makinën me një aromë thellësisht frutore luleshtrydheje",
    en: "Deep strawberry scent car freshener",
  },
  sellingPrice: 3.5,
});

const lemon = product({
  id: "lem1",
  sku: "ROKO-LEM",
  name: { sq: "Arome K2 ROKO LEMON | 20g", en: "K2 ROKO LEMON" },
  brand: "K2",
  category: "Aksesore per veture",
  description: { sq: "Aromë limoni", en: "Lemon scent" },
});

const antifreeze = product({
  id: "af1",
  sku: "AF-G12",
  name: { sq: "Antifriz PRIMOIL G12 | 1L", en: "Antifreeze G12" },
  brand: "PRIMOIL",
  category: "Antifriz",
});

const brakePaint = product({
  id: "bp1",
  sku: "PAINT1",
  name: {
    sq: "Sprej ngjyre per cilinder K2 BRAKE CALIPER PAINT RED",
    en: "Brake caliper paint",
  },
  brand: "K2",
  category: "Aksesore per veture",
});

describe("parseCustomerQuery", () => {
  it("maps Albanian strawberry perfume variants to air_freshener + scent", () => {
    for (const q of [
      "arom dredhez",
      "aroma me dredhez",
      "parfum per kerr dredhez",
      "aromë veture me aromë luleshtrydhe",
      "car perfume strawberry",
      "strawberry air freshener for car",
    ]) {
      const p = parseCustomerQuery(q);
      expect(p.typeId, q).toBe("air_freshener");
      expect(p.attributes, q).toContain("scent:strawberry");
    }
  });

  it("maps radiator water and functional freeze description to antifreeze", () => {
    expect(parseCustomerQuery("ujë për radiator").typeId).toBe("antifreeze");
    expect(parseCustomerQuery("uje per radiator").typeId).toBe("antifreeze");
    const functional = parseCustomerQuery(
      "I need the liquid that prevents the engine from freezing in winter"
    );
    expect(functional.typeId).toBe("antifreeze");
    expect(functional.brand).toBeUndefined();
    expect(parseCustomerQuery("antifriz per makin").typeId).toBe("antifreeze");
  });

  it("recognizes brake pad colloquial forms", () => {
    expect(parseCustomerQuery("feroda").typeId).toBe("brake_pads");
    expect(parseCustomerQuery("pllaka frenash").typeId).toBe("brake_pads");
    expect(parseCustomerQuery("brake pads").typeId).toBe("brake_pads");
  });

  it("preserves type/attrs across conversation refinements", () => {
    const prior = parseCustomerQuery("arom dredhez");
    const refined = parseCustomerQuery("vetëm K2 më të lira", prior);
    expect(refined.typeId).toBe("air_freshener");
    expect(refined.attributes).toContain("scent:strawberry");
    expect(refined.preferCheaper).toBe(true);
    expect(refined.brand?.toLowerCase()).toContain("k2");
  });
});

describe("attribute evidence", () => {
  it("verifies strawberry from name and from description-only", () => {
    expect(productHasAttribute(strawberryRoko, "scent:strawberry")).toBe(true);
    expect(productHasAttribute(strawberryDescOnly, "scent:strawberry")).toBe(
      true
    );
    expect(productHasAttribute(lemon, "scent:strawberry")).toBe(false);
  });

  it("requires verified scent for confirmed match", () => {
    const parsed = parseCustomerQuery("arom dredhez");
    const ok = evaluateProduct(strawberryRoko, parsed, 100, ["name"], "sq");
    const descOk = evaluateProduct(
      strawberryDescOnly,
      parsed,
      100,
      ["description"],
      "sq"
    );
    const bad = evaluateProduct(lemon, parsed, 100, ["name"], "sq");
    expect(ok.confidence).toBe("confirmed");
    expect(descOk.confidence).toBe("confirmed");
    expect(bad.confidence).toBe("partial");
    expect(bad.missingAttributes).toContain("scent:strawberry");
  });

  it("excludes antifreeze from perfume and brake paint from pads", () => {
    expect(productMatchesType(antifreeze, "antifreeze")).toBe(true);
    expect(productMatchesType(strawberryRoko, "antifreeze")).toBe(false);
    expect(productMatchesType(brakePaint, "brake_pads")).toBe(false);
  });

  it("does not treat interior plastic cleaners as air fresheners", () => {
    const protectant = product({
      id: "prot1",
      sku: "POLO1",
      name: {
        sq: "Pastrues për plastika K2 POLO PROTECTANT | 750ml MIX",
        en: "Plastic cleaner",
      },
      brand: "K2",
      category: "Aksesore per veture",
      description: {
        sq: "Freskon brendësinë e makinës me aromë që zgjat.",
        en: "Freshens the car interior with lasting scent.",
      },
    });
    expect(productMatchesType(protectant, "air_freshener")).toBe(false);
    const parsed = parseCustomerQuery("arom dredhez");
    expect(
      evaluateProduct(protectant, parsed, 200, ["fuzzy"], "sq").confidence
    ).toBe("none");
  });

  it("does not match sea inside seats (word boundary)", () => {
    expect(textHasTerm("leather seats cleaner", "sea")).toBe(false);
    expect(textHasTerm("ocean sea breeze", "sea")).toBe(true);
    expect(textHasTerm("antifriz g11", "g11")).toBe(true);
  });

  it("does not map leather seats to ocean air fresheners", () => {
    for (const q of [
      "Products to maintain leather seats",
      "leather seat cleaner",
      "Leather cleaner",
    ]) {
      const p = parseCustomerQuery(q);
      expect(p.attributes, q).not.toContain("scent:ocean");
      expect(p.typeId, q).not.toBe("air_freshener");
      expect(
        p.typeId === "leather_care" || p.typeId === null,
        `${q} → ${p.typeId}`
      ).toBe(true);
    }
    expect(parseCustomerQuery("Leather cleaner").typeId).toBe("leather_care");
    expect(parseCustomerQuery("Products to maintain leather seats").typeId).toBe(
      "leather_care"
    );
  });

  it("maps G11 antifreeze grade and verifies product evidence", () => {
    const g11 = product({
      id: "af-g11",
      sku: "G11",
      name: { sq: "Antifriz BELL G11 Super 100 | 1L", en: "Antifreeze G11" },
      brand: "BELL",
      category: "Antifriz",
    });
    const g13 = product({
      id: "af-g13",
      sku: "G13",
      name: { sq: "Antifriz PRIMOIL G13 | 1L", en: "Antifreeze G13" },
      brand: "PRIMOIL",
      category: "Antifriz",
    });
    const perfumeLeather = product({
      id: "ar-leather",
      sku: "CAYON-L",
      name: {
        sq: "Arome sprej K2 CAYON REAL LEATHER | 250ml",
        en: "Leather scent spray",
      },
      brand: "K2",
      category: "Aksesore per veture",
    });
    const leatherCleaner = product({
      id: "letan",
      sku: "LETAN",
      name: { sq: "Pastrues i lekures K2 LETAN | 250ml", en: "Leather cleaner" },
      brand: "K2",
      category: "Aksesore per veture",
    });

    const parsed = parseCustomerQuery("Antifriz makine G11");
    expect(parsed.typeId).toBe("antifreeze");
    expect(parsed.attributes).toContain("grade:g11");
    expect(evaluateProduct(g11, parsed, 100, ["name"], "sq").confidence).toBe(
      "confirmed"
    );
    expect(evaluateProduct(g13, parsed, 100, ["name"], "sq").confidence).toBe(
      "partial"
    );

    expect(productMatchesType(leatherCleaner, "leather_care")).toBe(true);
    expect(productMatchesType(perfumeLeather, "leather_care")).toBe(false);
  });
});
