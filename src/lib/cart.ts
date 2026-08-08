import type { LocaleText, Product } from "@/lib/products";

export const CART_STORAGE_KEY = "auto-shabani-cart";
export const CART_MAX_QTY = 99;

/** Snapshot stored in cart — survives catalogue refreshes. */
export type CartItem = {
  slug: string;
  sku: string;
  code: string;
  name: LocaleText;
  brand: string;
  image: string;
  sellingPrice: number | null;
  quantity: number;
};

export type CartProductInput = Pick<
  Product,
  "slug" | "sku" | "code" | "name" | "brand" | "image" | "sellingPrice"
>;

export function productToCartItem(
  product: CartProductInput,
  quantity = 1
): CartItem {
  return {
    slug: product.slug,
    sku: product.sku,
    code: product.code,
    name: product.name,
    brand: product.brand,
    image: product.image,
    sellingPrice: product.sellingPrice,
    quantity: clampQty(quantity),
  };
}

export function clampQty(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(CART_MAX_QTY, Math.max(1, Math.floor(n)));
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number | null {
  let sum = 0;
  let hasPrice = false;
  for (const item of items) {
    if (item.sellingPrice === null || Number.isNaN(item.sellingPrice)) continue;
    hasPrice = true;
    sum += item.sellingPrice * item.quantity;
  }
  return hasPrice ? sum : null;
}

export function readCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeStoredItem)
      .filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

export function writeCartToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota / private mode */
  }
}

function normalizeStoredItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.slug !== "string" || typeof row.sku !== "string") return null;

  const name =
    row.name && typeof row.name === "object"
      ? (row.name as LocaleText)
      : { sq: String(row.name ?? ""), en: String(row.name ?? "") };

  return {
    slug: row.slug,
    sku: row.sku,
    code: typeof row.code === "string" ? row.code : "",
    name: {
      sq: typeof name.sq === "string" ? name.sq : "",
      en: typeof name.en === "string" ? name.en : "",
    },
    brand: typeof row.brand === "string" ? row.brand : "",
    image: typeof row.image === "string" ? row.image : "",
    sellingPrice:
      row.sellingPrice === null || row.sellingPrice === undefined
        ? null
        : Number(row.sellingPrice),
    quantity: clampQty(Number(row.quantity ?? 1)),
  };
}
