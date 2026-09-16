import type { Product } from "@/lib/products";
import {
  inferGtin,
  productCanonicalUrl,
  schemaAvailability,
} from "@/lib/seo";

function compact<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = value;
  }
  return out as T;
}

export default function ProductJsonLd({ product }: { product: Product }) {
  const url = productCanonicalUrl(product.slug);
  const gtin = inferGtin(product);
  const name = product.name.sq || product.name.en;
  const description =
    product.description.sq || product.description.en || name;

  const offer = compact({
    "@type": "Offer",
    url,
    priceCurrency: "EUR",
    price:
      product.sellingPrice !== null
        ? product.sellingPrice.toFixed(2)
        : undefined,
    availability: schemaAvailability(product.stockStatus),
    seller: {
      "@type": "Organization",
      name: "AUTO SHABANI",
    },
  });

  const data = compact({
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    sku: product.sku || undefined,
    mpn: product.code || undefined,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    image: product.image ? [product.image] : undefined,
    url,
    offers: offer,
  });

  if (gtin) {
    (data as Record<string, unknown>)[gtin.kind] = gtin.value;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
