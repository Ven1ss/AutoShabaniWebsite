"use client";

import { useLanguage } from "@/context/LanguageContext";
import { trackEvent } from "@/lib/analytics";
import {
  CONTACT,
  buildEnquireMessage,
  mailtoEnquireUrl,
  whatsappEnquireUrl,
} from "@/lib/contact";
import { getLocalized, type Product } from "@/lib/products";

type Props = {
  product: Product;
};

export default function ProductEnquiry({ product }: Props) {
  const { t, locale } = useLanguage();
  const name = getLocalized(product.name, locale);
  const message = buildEnquireMessage({ sku: product.sku, name, locale });

  return (
    <div className="border-t border-steel-light pt-6 sm:pt-8 space-y-3">
      <p className="text-sm text-as-secondary max-w-md leading-relaxed">
        {t.catalogueEnquireNote}
      </p>
      <a
        href={whatsappEnquireUrl(message)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("whatsapp_click", { place: "pdp" })}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-deep transition-colors"
      >
        {t.cartSendWhatsApp}
      </a>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <a
          href={`tel:${CONTACT.phoneTel[0]}`}
          className="text-as-secondary hover:text-as-dark underline-offset-2 hover:underline transition-colors"
        >
          {t.catalogueCall}
        </a>
        <a
          href={mailtoEnquireUrl({ sku: product.sku, name, message })}
          className="text-as-secondary hover:text-as-dark underline-offset-2 hover:underline transition-colors"
        >
          {t.catalogueEmail}
        </a>
      </div>
    </div>
  );
}
