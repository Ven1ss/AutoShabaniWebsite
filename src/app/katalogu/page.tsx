import CataloguePageClient from "@/components/CataloguePageClient";
import { getProducts } from "@/lib/products-api";

// Always read current inventory so products added in Supabase appear immediately.
export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  const products = await getProducts();
  return <CataloguePageClient products={products} />;
}
