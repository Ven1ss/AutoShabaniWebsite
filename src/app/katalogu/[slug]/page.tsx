import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import SiteNav from "@/components/ui/SiteNav";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/ProductDetail";
import ProductJsonLd from "@/components/ProductJsonLd";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import {
  getAllProductSlugs,
  getProductBySlugCached,
  getRelatedProductsCached,
} from "@/lib/products-api";
import { brandPath } from "@/lib/products";
import { isUuid } from "@/lib/slug";
import {
  buildProductDescription,
  buildProductTitle,
  productCanonicalPath,
  productCanonicalUrl,
} from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 120;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs
    .filter((item) => Boolean(item.slug))
    .map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugCached(slug);
  if (!product) notFound();

  const title = buildProductTitle(product);
  const description = buildProductDescription(product);
  const canonical = productCanonicalPath(product.slug);
  const url = productCanonicalUrl(product.slug);
  const images = product.image ? [product.image] : ["/logo.png"];

  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url,
      images,
      type: "website",
      locale: "sq_AL",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlugCached(slug);
  if (!product) notFound();

  if (isUuid(slug) && product.slug && product.slug !== slug) {
    permanentRedirect(productCanonicalPath(product.slug));
  }

  const related = await getRelatedProductsCached(product, 4);
  const name = product.name.sq || product.name.en;
  const crumbs = [
    { href: "/", label: "Ballina" },
    { href: "/katalogu", label: "Katalogu" },
    ...(product.brand
      ? [{ href: brandPath(product.brand), label: product.brand }]
      : []),
    { label: name },
  ];

  return (
    <>
      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd items={crumbs} />
      <SiteNav />
      <main className="min-h-screen bg-surface">
        <ProductDetail product={product} related={related} />
      </main>
      <Footer />
    </>
  );
}
