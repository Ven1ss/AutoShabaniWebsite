"use client";

import dynamic from "next/dynamic";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import type { ReactNode } from "react";

const CartDrawer = dynamic(() => import("@/components/CartDrawer"), {
  ssr: false,
  loading: () => null,
});

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
