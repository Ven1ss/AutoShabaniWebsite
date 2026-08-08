import CataloguePageClient from "@/components/CataloguePageClient";
import { getProductsCached } from "@/lib/products-api";

/** Revalidate catalogue inventory about every 2 minutes. */
export const revalidate = 120;

export default async function CataloguePage() {
  const products = await getProductsCached();
  return <CataloguePageClient products={products} />;
}
