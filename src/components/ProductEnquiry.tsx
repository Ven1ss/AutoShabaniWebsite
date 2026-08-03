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
    <div className="border border-steel-light bg-surface-alt p-5 sm:p-6 md:p-8">
      <p className="text-xs tracking-[0.28em] uppercase text-signal font-semibold mb-3">
        {t.catalogueEnquire}
      </p>
      <p className="text-sm text-ink-muted mb-6 max-w-md leading-relaxed">
        {t.catalogueEnquireNote}
      </p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <a
          href={whatsappEnquireUrl(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 bg-signal hover:bg-signal-deep active:bg-signal-deep text-white text-sm font-semibold tracking-wider uppercase px-6 py-3.5 transition-colors"
        >
          {t.catalogueWhatsApp}
        </a>
        <a
          href={`tel:${CONTACT.phoneTel[0]}`}
          className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 border border-ink/15 hover:border-ink/40 active:border-ink/40 text-ink text-sm font-semibold tracking-wider uppercase px-6 py-3.5 transition-colors"
        >
          {t.catalogueCall}
        </a>
        <a
          href={mailtoEnquireUrl({ sku: product.sku, name, message })}
          className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 border border-ink/15 hover:border-ink/40 active:border-ink/40 text-ink text-sm font-semibold tracking-wider uppercase px-6 py-3.5 transition-colors"
        >
          {t.catalogueEmail}
        </a>
      </div>
    </div>
  );
}
