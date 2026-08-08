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
      <main className="min-h-screen bg-[linear-gradient(180deg,#eef0f3_0%,#f5f5f7_28%,#f5f5f7_100%)]">
        <section className="pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.25rem))] pb-[clamp(3rem,2rem+4vw,5rem)]">
          <div className="mx-auto w-full max-w-wide px-[clamp(0.75rem,0.4rem+1.5vw,1.5rem)]">
            <p className="mb-[clamp(1rem,0.6rem+1.5vw,2rem)] text-body text-as-secondary leading-relaxed max-w-2xl">
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
