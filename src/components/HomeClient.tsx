"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import ScrollProgress from "@/components/ScrollProgress";
import CatalogueHero from "@/components/CatalogueHero";
import TrustStrip from "@/components/TrustStrip";
import Brands from "@/components/Brands";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import type { Product } from "@/lib/products";

type Props = {
  featuredProducts: Product[];
  allProducts: Product[];
};

export default function HomeClient({ featuredProducts, allProducts }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const products = allProducts.length > 0 ? allProducts : featuredProducts;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">{isLoading && <LoadingScreen />}</AnimatePresence>

      <ScrollProgress />
      <Header variant="solid" />
      <main>
        <CatalogueHero products={products} />
        <TrustStrip />
        <Brands />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
