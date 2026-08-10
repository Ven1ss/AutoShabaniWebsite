import SiteNav from "@/components/ui/SiteNav";
import HomeHero from "@/components/home/HomeHero";
import HomeSearchStrip from "@/components/home/HomeSearchStrip";
import HomeTrustBar from "@/components/home/HomeTrustBar";
import BrandLogoStrip from "@/components/home/BrandLogoStrip";
import WhyUs from "@/components/home/WhyUs";
import FeaturedProducts from "@/components/FeaturedProducts";
import HomeContact from "@/components/home/HomeContact";
import Footer from "@/components/Footer";
import { getProductsCached } from "@/lib/products-api";
import { getRatingStatsMapCached } from "@/lib/rating-stats";

export const revalidate = 120;

export default async function Home() {
  const [products, ratings] = await Promise.all([
    getProductsCached(),
    getRatingStatsMapCached(),
  ]);

  const withRatings = products.map((p) => ({
    ...p,
    ratingAverage: ratings[p.id]?.average,
    ratingCount: ratings[p.id]?.count,
  }));

  return (
    <>
      <SiteNav overDark />
      <main>
        <HomeHero />
        <HomeSearchStrip />
        <HomeTrustBar />
        <FeaturedProducts products={withRatings} />
        <BrandLogoStrip />
        <WhyUs />
        <HomeContact />
        <Footer />
      </main>
    </>
  );
}
