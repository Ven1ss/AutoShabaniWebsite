import Header from "@/components/Header";
import ScrollProgress from "@/components/ScrollProgress";
import MarketingHero from "@/components/MarketingHero";
import FeaturedProducts from "@/components/FeaturedProducts";
import TrustStrip from "@/components/TrustStrip";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { getProductsCached } from "@/lib/products-api";

/** Cache product list — inventory updates within ~60s via ISR. */
export const revalidate = 60;

export default async function Home() {
  const products = await getProductsCached();

  return (
    <>
      <ScrollProgress />
      <Header variant="hero" />
      <main>
        <MarketingHero />
        <FeaturedProducts products={products} />
        <TrustStrip />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
