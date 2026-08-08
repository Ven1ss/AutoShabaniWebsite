import type { Product } from "@/lib/products";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://autoshabani.com";

export default function ProductJsonLd({ product }: { product: Product }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name.sq,
    description: product.description.sq || product.name.sq,
    sku: product.sku,
    mpn: product.code || undefined,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    image: product.image ? [product.image] : undefined,
    url: `${siteUrl}/katalogu/${product.slug}`,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/katalogu/${product.slug}`,
      priceCurrency: "EUR",
      price:
        product.sellingPrice !== null
          ? product.sellingPrice.toFixed(2)
          : undefined,
      availability:
        product.stockStatus === "in_stock"
          ? "https://schema.org/InStock"
          : product.stockStatus === "out_of_stock"
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/PreOrder",
      seller: {
        "@type": "Organization",
        name: "AUTO SHABANI",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
