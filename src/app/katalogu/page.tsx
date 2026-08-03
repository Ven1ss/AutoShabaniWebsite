import CataloguePageClient from "@/components/CataloguePageClient";
import { getProductsCached } from "@/lib/products-api";

/** Revalidate catalogue inventory about every minute. */
export const revalidate = 60;

export default async function CataloguePage() {
  const products = await getProductsCached();
  return <CataloguePageClient products={products} />;
}
