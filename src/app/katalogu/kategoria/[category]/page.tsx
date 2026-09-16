import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/ui/SiteNav";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { getProductsCached } from "@/lib/products-api";
import {
  isProductCategory,
  matchCategorySlug,
  slugifyBrand,
} from "@/lib/products";
import { getServerLocale } from "@/lib/locale";
import { translations } from "@/lib/translations";

type Props = {
  params: Promise<{ category: string }>;
};

export const revalidate = 120;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const products = await getProductsCached();
  const match = products.find((p) => matchCategorySlug(p.category, category));
  if (!match) {
    return {
      title: "Kategoria nuk u gjet",
      robots: { index: false, follow: true },
    };
  }
  const raw = match.category;
  const label = isProductCategory(raw)
    ? translations.sq[`cat_${raw}`]
    : raw;
  const canonical = `/katalogu/kategoria/${encodeURIComponent(slugifyBrand(raw))}`;
  return {
    title: `${label} — pjesë këmbimi`,
    description: `${label} te AUTO SHABANI në Prishtinë. Shiko produktet e kësaj kategorie.`,
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const locale = await getServerLocale();
  const t = translations[locale];
  const products = await getProductsCached();
  const filtered = products.filter((p) =>
    matchCategorySlug(p.category, category)
  );
  if (filtered.length === 0) notFound();
  const raw = filtered[0].category;
  const label = isProductCategory(raw) ? t[`cat_${raw}`] : raw;

  const crumbs = [
    { href: "/", label: t.breadcrumbHome },
    { href: "/katalogu", label: t.navCatalogue },
    { label },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { href: "/", label: "Ballina" },
          { href: "/katalogu", label: "Katalogu" },
          {
            label: isProductCategory(raw)
              ? translations.sq[`cat_${raw}`]
              : raw,
          },
        ]}
      />
      <SiteNav />
      <main className="min-h-screen bg-surface">
        <section className="pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.25rem))] pb-[clamp(3rem,2rem+4vw,5rem)]">
          <div className="mx-auto w-full max-w-wide px-[var(--page-pad-x)]">
            <Breadcrumbs items={crumbs} />
            <p className="text-caption uppercase tracking-[0.16em] text-accent mb-2">
              {t.categoryPageTitle}
            </p>
            <h1 className="text-title text-as-dark mb-2">{label}</h1>
            <p className="text-sm text-as-secondary mb-8 tabular-nums">
              {filtered.length} {t.catalogueResults}
            </p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[clamp(0.55rem,0.4rem+0.7vw,1rem)]">
              {filtered.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} compact />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
