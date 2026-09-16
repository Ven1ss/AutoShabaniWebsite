import { unstable_noStore as noStore } from "next/cache";
import SiteNav from "@/components/ui/SiteNav";
import HomeHero from "@/components/home/HomeHero";
import HomeSearchStrip from "@/components/home/HomeSearchStrip";
import HomeTrustBar from "@/components/home/HomeTrustBar";
import BrandLogoStrip from "@/components/home/BrandLogoStrip";
import WhyUs from "@/components/home/WhyUs";
import FeaturedProducts from "@/components/FeaturedProducts";
import HomeContact from "@/components/home/HomeContact";
import Footer from "@/components/Footer";
import OrganizationJsonLd from "@/components/OrganizationJsonLd";
import { getProductsCached } from "@/lib/products-api";
import { getRatingStatsMapCached } from "@/lib/rating-stats";
import { pickRandomProducts } from "@/lib/products";

const FEATURED_COUNT = 8;

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
        <FeaturedProducts products={featured} />
        <BrandLogoStrip />
        <WhyUs />
        <HomeContact />
        <Footer />
      </main>
    </>
  );
}
