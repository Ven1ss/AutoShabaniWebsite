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
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section id="brands" ref={ref} className="relative py-12 md:py-16 bg-surface">
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <motion.p
          className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-faint mb-6"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {t.brandsHeading}
        </motion.p>

        <ul className="flex flex-wrap items-center gap-x-8 gap-y-5 md:gap-x-10">
          {brands.map((brand, i) => (
            <motion.li
              key={brand.name}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.35, delay: i * 0.03 }}
            >
              <Image
                src={brand.src}
                alt={brand.name}
                width={120}
                height={40}
                className="h-7 md:h-8 w-auto max-w-[110px] object-contain opacity-55 hover:opacity-100 transition-opacity duration-200"
                unoptimized
              />
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
