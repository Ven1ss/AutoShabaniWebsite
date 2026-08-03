"use client";

import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
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
      <ScrollProgress />
      <Header variant="solid" />
      <main className="min-h-screen bg-surface bg-surface-noise">
        <section className="pt-[max(6.5rem,calc(env(safe-area-inset-top)+5rem))] pb-14 sm:pb-16 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="mb-6 sm:mb-10 md:mb-12">
              <h1 className="font-mono text-[10px] tracking-[0.22em] uppercase text-signal font-semibold mb-2 sm:mb-3">
                {t.navCatalogue}
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-ink-muted max-w-xl leading-relaxed">
                {t.catalogueSubtitle}
              </p>
            </div>
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
