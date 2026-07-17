"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

const brands = [
  { name: "Bosch", src: "/brands/bosch.svg" },
  { name: "Brembo", src: "/brands/brembo.svg" },
  { name: "Continental", src: "/brands/continental.svg" },
  { name: "Denso", src: "/brands/denso.svg" },
  { name: "Gates", src: "/brands/gates.svg" },
  { name: "Mahle", src: "/brands/mahle.svg" },
  { name: "MANN-FILTER", src: "/brands/mann-filter.svg" },
  { name: "SKF", src: "/brands/skf.svg" },
  { name: "Valeo", src: "/brands/valeo.svg" },
  { name: "ZF", src: "/brands/zf.svg" },
];

export default function Brands() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="brands" ref={ref} className="relative py-20 md:py-28 bg-surface-alt">
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <motion.p
          className="font-display text-2xl md:text-3xl font-semibold uppercase tracking-tight text-ink mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          {t.brandsHeading}
        </motion.p>

        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 border-t border-l border-steel-light/80">
          {brands.map((brand, i) => (
            <motion.li
              key={brand.name}
              className="flex items-center justify-center min-h-[100px] md:min-h-[112px] border-r border-b border-steel-light/80 px-5 py-6"
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{
                duration: 0.5,
                delay: i * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Image
                src={brand.src}
                alt={brand.name}
                width={140}
                height={48}
                className="h-9 md:h-10 w-auto max-w-[140px] object-contain opacity-80 hover:opacity-100 transition-opacity duration-200"
                unoptimized
              />
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
