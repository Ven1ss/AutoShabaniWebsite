"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import CatalogueBrowser from "@/components/CatalogueBrowser";
import { useLanguage } from "@/context/LanguageContext";
import type { Product } from "@/lib/products";

const ease = [0.16, 1, 0.3, 1] as const;

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
        <section className="pt-28 md:pt-32 pb-16 md:pb-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease }}
              className="mb-10 md:mb-12"
            >
              <h1 className="font-mono text-[10px] tracking-[0.22em] uppercase text-signal font-semibold mb-3">
                {t.navCatalogue}
              </h1>
              <p className="text-base md:text-lg text-ink-muted max-w-xl leading-relaxed">
                {t.catalogueSubtitle}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease }}
            >
              <Suspense fallback={null}>
                <CatalogueBrowser products={products} />
              </Suspense>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
