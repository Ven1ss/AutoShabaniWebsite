"use client";

import AddToCartButton from "@/components/AddToCartButton";
import { trackEvent } from "@/lib/analytics";
import {
  buildEnquireMessage,
  whatsappEnquireUrl,
} from "@/lib/contact";
import { getLocalized, isSellableOnline, type Product } from "@/lib/products";
import { useLanguage } from "@/context/LanguageContext";

/** Fixed mobile CTA on product pages — cart when sellable, else WhatsApp. */
export default function MobileStickyEnquire({ product }: { product: Product }) {
  const { t, locale } = useLanguage();
  const name = getLocalized(product.name, locale);
  const sellable = isSellableOnline(product);

  if (sellable) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-steel-light bg-as-white/95 backdrop-blur-md px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] md:hidden">
        <AddToCartButton product={product} size="lg" />
      </div>
    );
  }

  const href = whatsappEnquireUrl(
    buildEnquireMessage({ sku: product.sku, name, locale })
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-steel-light bg-as-white/95 backdrop-blur-md px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] md:hidden">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("whatsapp_click", { place: "pdp_sticky" })}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accent text-sm font-semibold text-white"
      >
        {t.mobileEnquireSticky}
      </a>
    </div>
  );
}
