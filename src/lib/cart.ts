import {
  isSellableOnline,
  maxOrderQty,
  type LocaleText,
  type Product,
  type StockStatus,
} from "@/lib/products";

export const CART_STORAGE_KEY = "auto-shabani-cart";
export const CART_MAX_QTY = 99;

/** Snapshot stored in cart — survives catalogue refreshes. */
export type CartItem = {
  id: string;
  slug: string;
  sku: string;
  code: string;
  name: LocaleText;
  brand: string;
  image: string;
  sellingPrice: number | null;
  quantity: number;
  stockStatus: StockStatus;
  stockQty: number | null;
};

export type CartProductInput = Pick<
  Product,
  | "id"
  | "slug"
  | "sku"
  | "code"
  | "name"
  | "brand"
  | "image"
  | "sellingPrice"
  | "stockStatus"
  | "stockQty"
>;

export function productToCartItem(
  product: CartProductInput,
  quantity = 1
): CartItem {
  const max = maxOrderQty(product, CART_MAX_QTY);
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    code: product.code,
    name: product.name,
    brand: product.brand,
    image: product.image,
    sellingPrice: product.sellingPrice,
    quantity: clampQty(quantity, max),
    stockStatus: product.stockStatus,
    stockQty: product.stockQty ?? null,
  };
}

export function clampQty(n: number, max = CART_MAX_QTY): number {
  if (!Number.isFinite(n)) return 1;
  const ceiling = Math.max(1, max);
  return Math.min(ceiling, Math.max(1, Math.floor(n)));
}

export function cartItemMaxQty(item: CartItem): number {
  return maxOrderQty({ stockQty: item.stockQty }, CART_MAX_QTY);
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

export function cartHasSellableItems(items: CartItem[]): boolean {
  return items.some((item) =>
    isSellableOnline({
      sellingPrice: item.sellingPrice,
      stockStatus: item.stockStatus,
      stockQty: item.stockQty,
    })
  );
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

  const stockStatus =
    row.stockStatus === "in_stock" ||
    row.stockStatus === "out_of_stock" ||
    row.stockStatus === "on_request"
      ? row.stockStatus
      : "on_request";

  const stockQty =
    row.stockQty === null || row.stockQty === undefined
      ? null
      : Number(row.stockQty);
  const max = maxOrderQty(
    { stockQty: stockQty === null || Number.isNaN(stockQty) ? null : stockQty },
    CART_MAX_QTY
  );

  return {
    id: typeof row.id === "string" && row.id ? row.id : row.slug,
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
    quantity: clampQty(Number(row.quantity ?? 1), Math.max(1, max || 1)),
    stockStatus,
    stockQty: stockQty === null || Number.isNaN(stockQty) ? null : stockQty,
  };
}
