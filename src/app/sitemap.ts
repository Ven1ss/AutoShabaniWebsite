import type { MetadataRoute } from "next";
import { getAllProductSlugs, getProductsCached } from "@/lib/products-api";
import { slugifyBrand } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";

/** Google's URL cap per sitemap; split into an index if we ever approach this. */
const SITEMAP_URL_LIMIT = 45_000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, products] = await Promise.all([
    getAllProductSlugs(),
    getProductsCached(),
  ]);

  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];
  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/katalogu`,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const seenSlugs = new Set<string>();
  const productRoutes: MetadataRoute.Sitemap = [];
  for (const item of slugs) {
    if (!item.slug || seenSlugs.has(item.slug)) continue;
    seenSlugs.add(item.slug);
    productRoutes.push({
      url: `${SITE_URL}/katalogu/${item.slug}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  const brandRoutes: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${SITE_URL}/katalogu/marka/${encodeURIComponent(slugifyBrand(brand))}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/katalogu/kategoria/${encodeURIComponent(slugifyBrand(category))}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const entries = [
    ...staticRoutes,
    ...productRoutes,
    ...brandRoutes,
    ...categoryRoutes,
  ];

  if (entries.length > SITEMAP_URL_LIMIT) {
    console.warn(
      `[sitemap] ${entries.length} URLs exceeds ${SITEMAP_URL_LIMIT}; split into a sitemap index.`
    );
  }

  return entries;
}
