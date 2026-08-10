import { describe, expect, it } from "vitest";
import { buildProductSlug, slugify } from "@/lib/slug";
import { cartItemCount, clampQty, productToCartItem } from "@/lib/cart";
import {
  filterProducts,
  isSellableOnline,
  maxOrderQty,
  whyNotSellableOnline,
  type Product,
} from "@/lib/products";
import {
  canTransition,
  formatOrderNumber,
  isValidOrderNumber,
  validateEmail,
  validatePhone,
} from "@/lib/orders";
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
  sellOnline: true,
  stockQty: null,
  maxQtyPerOrder: 10,
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
    expect(clampQty(20, 5)).toBe(5);
  });

  it("counts items", () => {
    const item = productToCartItem(sample, 2);
    expect(cartItemCount([item])).toBe(2);
  });
});

describe("sellable online", () => {
  it("allows priced in-stock products", () => {
    expect(isSellableOnline(sample)).toBe(true);
    expect(whyNotSellableOnline(sample)).toBeNull();
  });

  it("blocks on-request and out-of-stock", () => {
    expect(
      isSellableOnline({ ...sample, stockStatus: "on_request" })
    ).toBe(false);
    expect(
      isSellableOnline({ ...sample, stockStatus: "out_of_stock" })
    ).toBe(false);
    expect(whyNotSellableOnline({ ...sample, sellingPrice: null })).toBe(
      "no_price"
    );
  });

  it("respects sell_online and stock_qty", () => {
    expect(isSellableOnline({ ...sample, sellOnline: false })).toBe(false);
    expect(isSellableOnline({ ...sample, stockQty: 0 })).toBe(false);
    expect(maxOrderQty({ ...sample, stockQty: 3, maxQtyPerOrder: 10 })).toBe(3);
  });
});

describe("filterProducts", () => {
  it("filters by brand", () => {
    expect(filterProducts([sample], { brand: "ABRO" })).toHaveLength(1);
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

describe("order helpers", () => {
  it("formats and validates order numbers", () => {
    expect(formatOrderNumber(2026, 42)).toBe("AS-2026-000042");
    expect(isValidOrderNumber("AS-2026-000001")).toBe(true);
    expect(isValidOrderNumber("bad")).toBe(false);
  });

  it("enforces status transitions", () => {
    expect(canTransition("pending_payment", "awaiting_pickup")).toBe(true);
    expect(canTransition("ready", "completed")).toBe(true);
    expect(canTransition("completed", "preparing")).toBe(false);
  });

  it("validates phone and email", () => {
    expect(validatePhone("+383 49 238 509")).toBe(true);
    expect(validatePhone("12")).toBe(false);
    expect(validateEmail("a@b.co")).toBe(true);
    expect(validateEmail("nope")).toBe(false);
  });
});
