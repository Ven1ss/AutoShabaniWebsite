import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/ui/SiteNav";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { getProductsCached } from "@/lib/products-api";
import { isProductCategory, matchCategorySlug } from "@/lib/products";
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
  const raw = match?.category || decodeURIComponent(category);
  return {
    title: raw,
    description: `${raw} — AUTO SHABANI katalogu`,
    alternates: { canonical: `/katalogu/kategoria/${category}` },
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
  const raw = filtered[0]?.category || decodeURIComponent(category);
  const label = isProductCategory(raw) ? t[`cat_${raw}`] : raw;

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-surface">
        <section className="pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.25rem))] pb-[clamp(3rem,2rem+4vw,5rem)]">
          <div className="mx-auto w-full max-w-wide px-[var(--page-pad-x)]">
            <Link
              href="/katalogu"
              className="inline-flex min-h-11 items-center gap-2 text-caption uppercase tracking-wider text-as-secondary hover:text-as-dark mb-6"
            >
              ← {t.catalogueBack}
            </Link>
            <p className="text-caption uppercase tracking-[0.16em] text-accent mb-2">
              {t.categoryPageTitle}
            </p>
            <h1 className="text-title text-as-dark mb-2">{label}</h1>
            <p className="text-sm text-as-secondary mb-8 tabular-nums">
              {filtered.length} {t.catalogueResults}
            </p>
            {filtered.length === 0 ? (
              <p className="text-as-gray">{t.catalogueEmpty}</p>
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[clamp(0.55rem,0.4rem+0.7vw,1rem)]">
                {filtered.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} compact />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
