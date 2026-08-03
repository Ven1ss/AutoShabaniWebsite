import SiteNav from "@/components/ui/SiteNav";
import HomeHero from "@/components/home/HomeHero";
import BrandLogoStrip from "@/components/home/BrandLogoStrip";
import WhyUs from "@/components/home/WhyUs";
import FeaturedProducts from "@/components/FeaturedProducts";
import HomeContact from "@/components/home/HomeContact";
import Footer from "@/components/Footer";
import { getProductsCached } from "@/lib/products-api";

/** Cache product list — inventory updates within ~60s via ISR. */
export const revalidate = 60;

export default async function Home() {
  const products = await getProductsCached();

  return (
    <>
      <SiteNav overDark />
      <main>
        <HomeHero />
        <BrandLogoStrip />
        <WhyUs />
        <FeaturedProducts products={products} />
        <HomeContact />
        <Footer />
      </main>
    </>
  );
}
