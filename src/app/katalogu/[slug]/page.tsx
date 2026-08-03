import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import ProductDetail from "@/components/ProductDetail";
import { getProductBySlug } from "@/lib/products-api";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "AUTO SHABANI" };
  return {
    title: `${product.name.en} | AUTO SHABANI`,
    description: product.description.en,
    openGraph: {
      title: `${product.name.en} | AUTO SHABANI`,
      description: product.description.en,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <ScrollProgress />
      <Header variant="solid" />
      <main className="min-h-screen bg-surface bg-surface-noise">
        <ProductDetail product={product} />
      </main>
      <Footer />
    </>
  );
}
