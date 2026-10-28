"use client";

import { Suspense } from "react";
import SiteNav from "@/components/ui/SiteNav";
import Footer from "@/components/Footer";
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

  const notice = t.catalogueInteriorNotice;
  const linkText = t.catalogueInteriorNoticeLink;
  const linkIndex = notice.toLowerCase().lastIndexOf(linkText.toLowerCase());
  const before = linkIndex >= 0 ? notice.slice(0, linkIndex) : notice;
  const after =
    linkIndex >= 0 ? notice.slice(linkIndex + linkText.length) : "";

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-as-snow">
        <section className="pt-[max(5.25rem,calc(env(safe-area-inset-top)+4rem))] pb-16 sm:pb-20">
          <div className="container-as">
            <header className="mb-6 sm:mb-8 max-w-2xl">
              <p className="text-caption font-medium uppercase tracking-[0.14em] text-as-gray mb-2">
                AUTO SHABANI
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-as-dark">
                {t.navCatalogue}
              </h1>
              <p className="mt-2 text-sm text-as-secondary leading-relaxed">
                {linkIndex >= 0 ? (
                  <>
                    {before}
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-as-dark underline underline-offset-2 hover:text-accent transition-colors"
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
                      className="font-medium text-as-dark underline underline-offset-2 hover:text-accent transition-colors"
                    >
                      {linkText}
                    </a>
                  </>
                )}
              </p>
            </header>

            <Suspense
              fallback={
                <div className="h-40 animate-pulse rounded-xl bg-as-mist/60" />
              }
            >
              <CatalogueBrowser products={products} />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
