import SiteNav from "@/components/ui/SiteNav";
import HomeHero from "@/components/home/HomeHero";
import HomeTrustBar from "@/components/home/HomeTrustBar";
import BrandLogoStrip from "@/components/home/BrandLogoStrip";
import WhyUs from "@/components/home/WhyUs";
import FeaturedProducts from "@/components/FeaturedProducts";
import HomeContact from "@/components/home/HomeContact";
import Footer from "@/components/Footer";
import { getProductsCached } from "@/lib/products-api";

/** Cache product list — inventory updates within ~2 minutes via ISR. */
export const revalidate = 120;

export default async function Home() {
  const products = await getProductsCached();

  return (
    <>
      <SiteNav overDark />
      <main>
        <HomeHero />
        <HomeTrustBar />
        <BrandLogoStrip />
        <WhyUs />
        <FeaturedProducts products={products} />
        <HomeContact />
        <Footer />
      </main>
    </>
  );
}
