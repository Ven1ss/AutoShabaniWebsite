import { getProducts } from "@/lib/products-api";
import HomeClient from "@/components/HomeClient";

// Keep featured catalogue products fresh when inventory changes in Supabase.
export const dynamic = "force-dynamic";

const FEATURED_COUNT = 10;

export default async function Home() {
  const products = await getProducts();
  const featuredProducts = products.slice(0, FEATURED_COUNT);

  return <HomeClient featuredProducts={featuredProducts} />;
}
