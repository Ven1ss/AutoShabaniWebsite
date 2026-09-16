import type { Metadata } from "next";
import CataloguePageClient from "@/components/CataloguePageClient";
import { getProductsCached } from "@/lib/products-api";
import { getRatingStatsMapCached } from "@/lib/rating-stats";
import { catalogueHasIndexableParams } from "@/lib/seo";

/** Revalidate catalogue inventory about every 2 minutes. */
export const revalidate = 120;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  const faceted = catalogueHasIndexableParams(params);
  return {
    title: "Katalogu i pjesëve",
    description:
      "Katalogu i pjesëve të këmbimit AUTO SHABANI në Prishtinë. Kërko sipas markës, SKU, kodit ose emrit.",
    alternates: { canonical: "/katalogu" },
    robots: faceted
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function CataloguePage() {
  const [products, ratings] = await Promise.all([
    getProductsCached(),
    getRatingStatsMapCached(),
  ]);

  const withRatings = products.map((p) => ({
    ...p,
    ratingAverage: ratings[p.id]?.average,
    ratingCount: ratings[p.id]?.count,
  }));

  return <CataloguePageClient products={withRatings} />;
}
