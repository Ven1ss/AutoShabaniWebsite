import type { MetadataRoute } from "next";
import { getAllProductSlugs, getProductsCached } from "@/lib/products-api";
import { slugifyBrand } from "@/lib/products";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://autoshabani.com";

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
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    {
      url: `${siteUrl}/katalogu`,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const productRoutes: MetadataRoute.Sitemap = slugs.map((item) => ({
    url: `${siteUrl}/katalogu/${item.slug}`,
    lastModified: item.updatedAt ? new Date(item.updatedAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const brandRoutes: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${siteUrl}/katalogu/marka/${encodeURIComponent(slugifyBrand(brand))}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/katalogu/kategoria/${encodeURIComponent(slugifyBrand(category))}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...productRoutes,
    ...brandRoutes,
    ...categoryRoutes,
  ];
}
