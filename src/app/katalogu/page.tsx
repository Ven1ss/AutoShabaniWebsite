import CataloguePageClient from "@/components/CataloguePageClient";
import { getProductsCached } from "@/lib/products-api";
import { getRatingStatsMapCached } from "@/lib/rating-stats";

/** Revalidate catalogue inventory about every 2 minutes. */
export const revalidate = 120;

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
