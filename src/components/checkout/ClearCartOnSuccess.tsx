"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { trackEvent } from "@/lib/analytics";

/** Clears the cart once on the order success page. */
export default function ClearCartOnSuccess({
  orderNumber,
}: {
  orderNumber?: string;
}) {
  const { clearCart, closeCart, hydrated } = useCart();

  useEffect(() => {
    if (!hydrated) return;
    clearCart();
    closeCart();
    if (orderNumber) {
      trackEvent("purchase", { order_number: orderNumber });
    }
  }, [hydrated, clearCart, closeCart, orderNumber]);

  return null;
}
