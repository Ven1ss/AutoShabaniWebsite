"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  cartItemCount,
  cartItemMaxQty,
  cartSubtotal,
  clampQty,
  productToCartItem,
  readCartFromStorage,
  writeCartToStorage,
  type CartItem,
  type CartProductInput,
} from "@/lib/cart";
import { isSellableOnline } from "@/lib/products";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number | null;
  isOpen: boolean;
  hydrated: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: CartProductInput, quantity?: number) => boolean;
  removeItem: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCartFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeCartToStorage(items);
  }, [items, hydrated]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  const addItem = useCallback(
    (product: CartProductInput, quantity = 1): boolean => {
      if (!isSellableOnline(product)) return false;
      const max = cartItemMaxQty({
        id: product.id,
        slug: product.slug,
        sku: product.sku,
        code: product.code,
        name: product.name,
        brand: product.brand,
        image: product.image,
        sellingPrice: product.sellingPrice,
        quantity: 1,
        stockStatus: product.stockStatus,
        sellOnline: product.sellOnline,
        stockQty: product.stockQty,
        maxQtyPerOrder: product.maxQtyPerOrder,
      });
      if (max < 1) return false;

      const qty = clampQty(quantity, max);
      setItems((prev) => {
        const existing = prev.find((item) => item.slug === product.slug);
        if (existing) {
          return prev.map((item) =>
            item.slug === product.slug
              ? {
                  ...item,
                  ...productToCartItem(product, 1),
                  quantity: clampQty(item.quantity + qty, max),
                }
              : item
          );
        }
        return [...prev, productToCartItem(product, qty)];
      });
      setIsOpen(true);
      return true;
    },
    []
  );

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((item) => item.slug !== slug));
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.slug !== slug) return item;
          const max = cartItemMaxQty(item);
          return { ...item, quantity: clampQty(quantity, max) };
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: cartItemCount(items),
      subtotal: cartSubtotal(items),
      isOpen,
      hydrated,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    }),
    [
      items,
      isOpen,
      hydrated,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
