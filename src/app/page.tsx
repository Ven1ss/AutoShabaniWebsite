import { getProducts } from "@/lib/products-api";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getProducts();
  return (
    <HomeClient featuredProducts={products.slice(0, 10)} allProducts={products} />
  );
}
