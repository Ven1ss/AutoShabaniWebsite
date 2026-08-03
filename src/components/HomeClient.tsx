"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import ScrollProgress from "@/components/ScrollProgress";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Brands from "@/components/Brands";
import CatalogueTeaser from "@/components/CatalogueTeaser";
import Experience from "@/components/Experience";
import Vision from "@/components/Vision";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import type { Product } from "@/lib/products";

type Props = {
  featuredProducts: Product[];
};

export default function HomeClient({ featuredProducts }: Props) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">{isLoading && <LoadingScreen />}</AnimatePresence>

      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <CatalogueTeaser products={featuredProducts} />
        <About />
        <Brands />
        <Experience />
        <Vision />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
