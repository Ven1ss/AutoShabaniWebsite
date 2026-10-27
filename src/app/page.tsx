import { unstable_noStore as noStore } from "next/cache";
import SiteNav from "@/components/ui/SiteNav";
import type { Metadata } from "next";
import HomeHero from "@/components/home/HomeHero";
import HomeSearchStrip from "@/components/home/HomeSearchStrip";
import HomeTrustBar from "@/components/home/HomeTrustBar";
import PopularCategories from "@/components/home/PopularCategories";
import BrandLogoStrip from "@/components/home/BrandLogoStrip";
import WhyUs from "@/components/home/WhyUs";
import FeaturedProducts from "@/components/FeaturedProducts";
import HomeContact from "@/components/home/HomeContact";
import Footer from "@/components/Footer";
import OrganizationJsonLd from "@/components/OrganizationJsonLd";
import { getProductsCached } from "@/lib/products-api";
import { getRatingStatsMapCached } from "@/lib/rating-stats";
import { pickRandomProducts } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";

const FEATURED_COUNT = 8;

export const metadata: Metadata = {
  title: {
    absolute: "AUTO SHABANI | Pjesë këmbimi — kërkim me AI, Prishtinë",
  },
  description:
    "Gjej pjesë këmbimi me kërkim inteligjent: emër, kod OE, markë ose përshkrim. Stok lokal në Prishtinë — AUTO SHABANI.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "AUTO SHABANI | Pjesë këmbimi me kërkim inteligjent",
    description:
      "Kërko sipas emrit, kodit OE, markës ose veturës. Çmime dhe stok të qarta.",
    url: SITE_URL,
    images: [{ url: "/hero-car.png", width: 1600, height: 900, alt: "AUTO SHABANI" }],
  },
};

export default async function Home() {
  // Fresh featured pick on every visit; product list itself stays cached.
  noStore();
  const [products, ratings] = await Promise.all([
    getProductsCached(),
    getRatingStatsMapCached(),
  ]);

  const withRatings = products.map((p) => ({
    ...p,
    ratingAverage: ratings[p.id]?.average,
    ratingCount: ratings[p.id]?.count,
  }));
  const featured = pickRandomProducts(withRatings, FEATURED_COUNT);

  return (
    <>
      <OrganizationJsonLd />
      <SiteNav overDark />
      <main>
        <HomeHero />
        <HomeSearchStrip />
        <HomeTrustBar />
        <PopularCategories />
        <FeaturedProducts products={featured} />
        <BrandLogoStrip />
        <WhyUs />
        <HomeContact />
        <Footer />
      </main>
    </>
  );
}
