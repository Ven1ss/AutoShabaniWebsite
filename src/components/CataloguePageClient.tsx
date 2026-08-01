"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CatalogueBrowser from "@/components/CatalogueBrowser";
import { useLanguage } from "@/context/LanguageContext";
import type { Product } from "@/lib/products";

type Props = {
  products: Product[];
};

export default function CataloguePageClient({ products }: Props) {
  const { t } = useLanguage();

  return (
    <>
      <Header variant="solid" />
      <main className="min-h-screen bg-surface bg-surface-noise">
        <section className="pt-28 md:pt-32 pb-16 md:pb-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <p className="text-xs tracking-[0.28em] uppercase text-signal font-semibold mb-4">
              {t.navCatalogue}
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-semibold uppercase tracking-tight text-ink mb-4">
              {t.catalogueTitle}
            </h1>
            <p className="text-base md:text-lg text-ink-muted max-w-xl leading-relaxed mb-12 md:mb-14">
              {t.catalogueSubtitle}
            </p>
            <CatalogueBrowser products={products} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
