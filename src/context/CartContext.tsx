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
  cartSubtotal,
  clampQty,
  productToCartItem,
  readCartFromStorage,
  writeCartToStorage,
  type CartItem,
  type CartProductInput,
} from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number | null;
  isOpen: boolean;
  hydrated: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: CartProductInput, quantity?: number) => void;
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
    (product: CartProductInput, quantity = 1) => {
      const qty = clampQty(quantity);
      setItems((prev) => {
        const existing = prev.find((item) => item.slug === product.slug);
        if (existing) {
          return prev.map((item) =>
            item.slug === product.slug
              ? { ...item, quantity: clampQty(item.quantity + qty) }
              : item
          );
        }
        return [...prev, productToCartItem(product, qty)];
      });
      setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((item) => item.slug !== slug));
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.slug === slug ? { ...item, quantity: clampQty(quantity) } : item
        )
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
