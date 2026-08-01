import CataloguePageClient from "@/components/CataloguePageClient";
import { getProducts } from "@/lib/products-api";

export const revalidate = 60;

export default async function CataloguePage() {
  const products = await getProducts();
  return <CataloguePageClient products={products} />;
}
