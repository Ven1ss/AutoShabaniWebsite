"use client";

import Image from "next/image";
import Link from "next/link";
import FadeIn from "@/components/ui/FadeIn";
import { PARTNER_BRANDS } from "@/lib/brands";
import { brandPath } from "@/lib/products";
import { useLanguage } from "@/context/LanguageContext";
import { trackEvent } from "@/lib/analytics";

/** Partner logos — each links to that brand’s catalogue page. */
export default function BrandLogoStrip() {
  const { t } = useLanguage();

  return (
    <section className="surface-white border-b border-black/[0.04]">
      <div className="container-as py-12 sm:py-14 md:py-16">
        <FadeIn>
          <p className="text-center text-sm font-medium text-as-secondary mb-8 sm:mb-10">
            {t.brandsHeading}
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:gap-x-10 md:gap-x-12">
            {PARTNER_BRANDS.map((brand) => (
              <li key={brand.name}>
                <Link
                  href={brandPath(brand.name)}
                  onClick={() =>
                    trackEvent("brand_strip_click", { brand: brand.name })
                  }
                  className="inline-flex min-h-11 min-w-[5.5rem] items-center justify-center opacity-45 transition-opacity duration-motion-fast hover:opacity-90 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-as-dark"
                  aria-label={brand.name}
                >
                  <Image
                    src={brand.src}
                    alt=""
                    width={120}
                    height={40}
                    className="h-6 sm:h-7 w-auto max-w-[100px] object-contain"
                    unoptimized
                  />
                </Link>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
