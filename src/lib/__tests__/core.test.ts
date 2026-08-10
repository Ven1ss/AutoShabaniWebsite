import { describe, expect, it } from "vitest";
import { buildProductSlug, slugify } from "@/lib/slug";
import { cartItemCount, clampQty, productToCartItem } from "@/lib/cart";
import { filterProducts, type Product } from "@/lib/products";
import { fieldMatchesQuery, withinEditDistance } from "@/lib/search-rank";

const sample: Product = {
  id: "1",
  slug: "abro-cleaner",
  sku: "EC533",
  code: "EC533",
  name: { sq: "Sprej", en: "Spray" },
  description: { sq: "", en: "" },
  brand: "ABRO",
  category: "Aksesore",
  image: "",
  sellingPrice: 4,
  featured: false,
  stockStatus: "in_stock",
};

describe("slugify", () => {
  it("builds seo slugs", () => {
    expect(slugify("ABRO Cleaner!")).toBe("abro-cleaner");
    expect(buildProductSlug({ name: "Oil Filter", sku: "F026" })).toContain(
      "oil-filter"
    );
  });
});

describe("cart helpers", () => {
  it("clamps quantity", () => {
    expect(clampQty(0)).toBe(1);
    expect(clampQty(200)).toBe(99);
  });

  it("counts items", () => {
    const item = productToCartItem(sample, 2);
    expect(cartItemCount([item])).toBe(2);
  });
});

describe("filterProducts", () => {
  it("filters by brand", () => {
    expect(
      filterProducts([sample], { brand: "ABRO" })
    ).toHaveLength(1);
    expect(filterProducts([sample], { brand: "BOSCH" })).toHaveLength(0);
  });
});

describe("search rank", () => {
  it("tolerates small typos", () => {
    expect(withinEditDistance("abro", "abro", 1)).toBe(true);
    expect(withinEditDistance("abro", "abrp", 1)).toBe(true);
    expect(fieldMatchesQuery("EC533", "ec533")).toBe("exact");
  });
});
