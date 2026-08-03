"use client";

import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import CatalogueBrowser from "@/components/CatalogueBrowser";
import { useLanguage } from "@/context/LanguageContext";
import { CONTACT } from "@/lib/contact";
import type { Product } from "@/lib/products";

type Props = {
  products: Product[];
};

export default function CataloguePageClient({ products }: Props) {
  const { t, locale } = useLanguage();
  const whatsappHref = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
    locale === "sq"
      ? "Përshëndetje, dua të pyes për pjesë të brendshme të makinës."
      : "Hello, I would like to ask about interior car parts."
  )}`;

  // Split notice so the contact phrase can be a link
  const notice = t.catalogueInteriorNotice;
  const linkText = t.catalogueInteriorNoticeLink;
  const linkIndex = notice.toLowerCase().lastIndexOf(linkText.toLowerCase());
  const before =
    linkIndex >= 0 ? notice.slice(0, linkIndex) : notice;
  const after =
    linkIndex >= 0 ? notice.slice(linkIndex + linkText.length) : "";

  return (
    <>
      <ScrollProgress />
      <Header variant="solid" />
      <main className="min-h-screen bg-surface bg-surface-noise">
        <section className="pt-[max(6.5rem,calc(env(safe-area-inset-top)+5rem))] pb-14 sm:pb-16 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            <p className="mb-6 sm:mb-8 text-base sm:text-lg text-ink leading-relaxed max-w-2xl">
              {linkIndex >= 0 ? (
                <>
                  {before}
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-signal underline underline-offset-2 hover:text-signal/80 transition-colors"
                  >
                    {notice.slice(linkIndex, linkIndex + linkText.length)}
                  </a>
                  {after}
                </>
              ) : (
                <>
                  {notice}{" "}
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-signal underline underline-offset-2 hover:text-signal/80 transition-colors"
                  >
                    {linkText}
                  </a>
                </>
              )}
            </p>
            <Suspense fallback={null}>
              <CatalogueBrowser products={products} />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
