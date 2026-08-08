import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteNav from "@/components/ui/SiteNav";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/ProductDetail";
import { getProductBySlugCached } from "@/lib/products-api";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 120;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugCached(slug);
  if (!product) return { title: "AUTO SHABANI" };
  return {
    title: `${product.name.en} | AUTO SHABANI`,
    description: product.description.en,
    openGraph: {
      title: `${product.name.en} | AUTO SHABANI`,
      description: product.description.en,
      images: product.image ? [product.image] : ["/logo.png"],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlugCached(slug);
  if (!product) notFound();

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-surface">
        <ProductDetail product={product} />
      </main>
      <Footer />
    </>
  );
}
