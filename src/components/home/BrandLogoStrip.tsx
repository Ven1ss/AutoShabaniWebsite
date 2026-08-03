"use client";

import Image from "next/image";
import FadeIn from "@/components/ui/FadeIn";
import { PARTNER_BRANDS } from "@/lib/brands";
import { useLanguage } from "@/context/LanguageContext";

/** Minimal partner logo row — reinforces trust under the hero. */
export default function BrandLogoStrip() {
  const { t } = useLanguage();

  return (
    <section className="surface-white border-b border-black/[0.04]">
      <div className="container-as py-12 sm:py-14 md:py-16">
        <FadeIn>
          <p className="text-center text-caption font-semibold uppercase tracking-[0.16em] text-as-gray mb-8 sm:mb-10">
            {t.brandsHeading}
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:gap-x-10 md:gap-x-12">
            {PARTNER_BRANDS.map((brand) => (
              <li key={brand.name} className="opacity-45 hover:opacity-80 transition-opacity duration-motion-fast">
                <Image
                  src={brand.src}
                  alt={brand.name}
                  width={120}
                  height={40}
                  className="h-6 sm:h-7 w-auto max-w-[100px] object-contain"
                  unoptimized
                />
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
