import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteNav from "@/components/ui/SiteNav";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/ProductDetail";
import ProductJsonLd from "@/components/ProductJsonLd";
import {
  getAllProductSlugs,
  getProductBySlugCached,
  getRelatedProductsCached,
} from "@/lib/products-api";
import { getServerLocale } from "@/lib/locale";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 120;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.slice(0, 200).map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugCached(slug);
  const locale = await getServerLocale();
  if (!product) return { title: "AUTO SHABANI" };

  const name = product.name[locale] || product.name.sq;
  const description =
    product.description[locale] ||
    product.description.sq ||
    `${name} — AUTO SHABANI`;

  return {
    title: name,
    description,
    openGraph: {
      title: `${name} | AUTO SHABANI`,
      description,
      images: product.image ? [product.image] : ["/logo.png"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | AUTO SHABANI`,
      description,
      images: product.image ? [product.image] : ["/logo.png"],
    },
    alternates: {
      canonical: `/katalogu/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlugCached(slug);
  if (!product) notFound();

  const related = await getRelatedProductsCached(product, 4);

  return (
    <>
      <ProductJsonLd product={product} />
      <SiteNav />
      <main className="min-h-screen bg-surface">
        <ProductDetail product={product} related={related} />
      </main>
      <Footer />
    </>
  );
}
