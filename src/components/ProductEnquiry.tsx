"use client";

import { useLanguage } from "@/context/LanguageContext";
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
    <div className="border-t border-steel-light pt-6 sm:pt-8">
      <p className="text-caption uppercase tracking-[0.18em] text-as-gray mb-1.5">
        {t.catalogueEnquire}
      </p>
      <p className="text-sm text-as-secondary mb-4 max-w-md leading-relaxed">
        {t.catalogueEnquireNote}
      </p>
      <div className="flex flex-wrap gap-2.5">
        <a
          href={whatsappEnquireUrl(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-as-dark/10 bg-as-white px-5 text-sm font-medium text-as-dark hover:border-accent hover:text-accent transition-colors"
        >
          {t.catalogueWhatsApp}
        </a>
        <a
          href={`tel:${CONTACT.phoneTel[0]}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-as-dark/10 bg-as-white px-5 text-sm font-medium text-as-dark hover:border-as-dark/30 transition-colors"
        >
          {t.catalogueCall}
        </a>
        <a
          href={mailtoEnquireUrl({ sku: product.sku, name, message })}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-as-dark/10 bg-as-white px-5 text-sm font-medium text-as-dark hover:border-as-dark/30 transition-colors"
        >
          {t.catalogueEmail}
        </a>
      </div>
    </div>
  );
}
