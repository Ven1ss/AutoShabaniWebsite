import type { Metadata } from "next";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import SectionHeading from "@/components/ui/SectionHeading";
import FadeIn from "@/components/ui/FadeIn";
import SiteNav from "@/components/ui/SiteNav";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/products";

export const metadata: Metadata = {
  title: "Design System — AUTO SHABANI",
  robots: "noindex",
};

/** Demo product for card preview — not from Supabase */
const demoProduct: Product = {
  slug: "demo-bosch-filter",
  sku: "F026407006",
  code: "0986AF1050",
  name: {
    sq: "Filtër vaji — shembull",
    en: "Oil filter — sample",
  },
  description: {
    sq: "Shembull produkti për design system.",
    en: "Sample product for design system.",
  },
  brand: "BOSCH",
  category: "filters",
  image:
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80",
  sellingPrice: 24.5,
};

const demoProduct2: Product = {
  ...demoProduct,
  slug: "demo-brembo",
  sku: "P85020",
  brand: "BREMBO",
  category: "brakes",
  name: { sq: "Disk freni — shembull", en: "Brake disc — sample" },
  sellingPrice: 89,
  image:
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80",
};

export default function DesignSystemPage() {
  return (
    <>
      <SiteNav overDark />
      <main>
        {/* Hero band explaining the system */}
        <section className="surface-black min-h-[70svh] flex flex-col justify-end section-pad">
          <div className="container-as">
            <FadeIn>
              <p className="text-caption font-semibold uppercase tracking-[0.14em] text-accent mb-4">
                Phase 1 · Design system
              </p>
              <h1 className="text-hero text-white max-w-4xl">
                Saktësi. Performancë. Perfeksion.
              </h1>
              <p className="mt-5 text-subhead text-white/70 max-w-xl">
                Sistemi vizual Apple-style për AUTO SHABANI — tipografi e madhe,
                hapësirë bujare, një theks i kuq, kartë produkti e përbashkët.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Decisions */}
        <section className="surface-white section-pad">
          <div className="container-as-narrow space-y-16">
            <FadeIn>
              <SectionHeading
                eyebrow="Vendimet"
                title="Çfarë u zgjodh dhe pse"
                subhead="Lexoje këtë para Phase 2. Nëse diçka nuk të pëlqen, ndryshojmë tani — jo pasi të ndërtohet homepage."
                align="left"
              />
            </FadeIn>

            <FadeIn delay={0.05} className="space-y-6 text-body text-as-secondary">
              <div>
                <h3 className="text-as-dark font-semibold mb-2">Tipografia</h3>
                <p>
                  <strong className="text-as-dark">Geist Sans</strong> (një familje
                  për display + UI) — e afërt me SF Pro, e lehtë, dhe mbështet
                  shkronjat shqipe. Verifikimi më poshtë:{" "}
                  <span className="text-as-dark">ë ç Ë Ç — Saktësi · Performancë · këmbimi</span>
                </p>
              </div>
              <div>
                <h3 className="text-as-dark font-semibold mb-2">Ngjyra</h3>
                <p>
                  Bazë monokrome (bardhë / #F5F5F7 / #1D1D1F / #86868B).{" "}
                  <strong className="text-accent">Një theks:</strong> #C8102E
                  (i kuqi yt) — vetëm CTA, çmime, highlights.
                </p>
              </div>
              <div>
                <h3 className="text-as-dark font-semibold mb-2">
                  Dark + light sections
                </h3>
                <p>
                  <strong className="text-as-dark">Po — alternim.</strong> Si Apple:
                  hero dhe momente brand në dark; katalogu, produktet dhe leximi
                  në light. Ritm premium pa shtuar ngjyra. Katalogu mbetet light
                  për lexueshmëri.
                </p>
              </div>
              <div>
                <h3 className="text-as-dark font-semibold mb-2">Hapësira</h3>
                <p>
                  Padding seksioni ~120–180px në desktop (
                  <code className="text-as-dark">section-pad</code>). Container
                  max ~1120px (wide) / 980px (narrow).
                </p>
              </div>
              <div>
                <h3 className="text-as-dark font-semibold mb-2">Motion</h3>
                <p>
                  Fade+rise 280–360ms, once on scroll. Hover i lehtë te butonat /
                  kartat.{" "}
                  <code className="text-as-dark">prefers-reduced-motion</code>{" "}
                  çaktivizon animimet.
                </p>
              </div>
              <div>
                <h3 className="text-as-dark font-semibold mb-2">Fotografia</h3>
                <p>
                  Phase 2 do të përdorë stock Unsplash (workshop / pjesë) si
                  placeholder i fortë derisa të kesh foto reale.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Color swatches */}
        <section className="surface-light section-pad">
          <div className="container-as">
            <SectionHeading eyebrow="Ngjyrat" title="Palette" className="mb-14" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { name: "White", hex: "#FFFFFF", cls: "bg-as-white border border-as-mist" },
                { name: "Snow", hex: "#F5F5F7", cls: "bg-as-snow border border-as-mist" },
                { name: "Mist", hex: "#E8E8ED", cls: "bg-as-mist" },
                { name: "Gray", hex: "#86868B", cls: "bg-as-gray" },
                { name: "Dark", hex: "#1D1D1F", cls: "bg-as-dark" },
                { name: "Accent", hex: "#C8102E", cls: "bg-accent" },
              ].map((c) => (
                <div key={c.name} className="space-y-2">
                  <div className={`aspect-square rounded-card ${c.cls}`} />
                  <p className="text-caption font-medium text-as-dark">{c.name}</p>
                  <p className="text-caption text-as-gray font-mono">{c.hex}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Type scale */}
        <section className="surface-white section-pad">
          <div className="container-as-narrow space-y-12">
            <SectionHeading
              eyebrow="Tipografia"
              title="Type scale"
              subhead="Geist Sans · latin + diacritics shqip"
              align="left"
            />
            <div className="space-y-10">
              <div>
                <p className="text-caption text-as-gray mb-2">hero</p>
                <p className="text-hero text-as-dark">Saktësi.</p>
              </div>
              <div>
                <p className="text-caption text-as-gray mb-2">section</p>
                <p className="text-section text-as-dark">Pse te ne</p>
              </div>
              <div>
                <p className="text-caption text-as-gray mb-2">subhead</p>
                <p className="text-subhead text-as-secondary">
                  Pjesë këmbimi origjinale në Prishtinë
                </p>
              </div>
              <div>
                <p className="text-caption text-as-gray mb-2">body</p>
                <p className="text-body text-as-secondary max-w-xl">
                  AUTO SHABANI është dyqani i pjesëve — OEM, origjinale, dhe
                  këshilla të qarta. Çmimet me TVSH.
                </p>
              </div>
              <div className="flex flex-wrap gap-8 items-end">
                <div>
                  <p className="text-caption text-as-gray mb-2">price</p>
                  <p className="text-price text-accent">24,50 €</p>
                </div>
                <div>
                  <p className="text-caption text-as-gray mb-2">button</p>
                  <p className="text-button text-as-dark">Shiko Katalogun</p>
                </div>
                <div>
                  <p className="text-caption text-as-gray mb-2">caption</p>
                  <p className="text-caption text-as-gray">SKU · F026407006</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons & badges */}
        <section className="surface-light section-pad">
          <div className="container-as space-y-16">
            <SectionHeading eyebrow="Komponentët" title="Button & Badge" />
            <div className="grid md:grid-cols-2 gap-12">
              <div className="rounded-media bg-as-white p-8 sm:p-10 space-y-5">
                <p className="text-caption text-as-gray">On light</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Shiko Katalogun</Button>
                  <Button variant="secondary">Na kontaktoni</Button>
                  <Button variant="ghost">Mëso më shumë</Button>
                </div>
              </div>
              <div className="rounded-media bg-as-dark p-8 sm:p-10 space-y-5">
                <p className="text-caption text-white/50">On dark</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" tone="dark">
                    Shiko Katalogun
                  </Button>
                  <Button variant="secondary" tone="dark">
                    Na kontaktoni
                  </Button>
                  <Button variant="ghost" tone="dark">
                    Mëso më shumë
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="accent">Origjinale</Badge>
              <Badge variant="neutral">OEM</Badge>
              <Badge variant="dark">Në stok</Badge>
              <Badge variant="success">Disponueshme</Badge>
            </div>
          </div>
        </section>

        {/* Section heading + product cards */}
        <section className="surface-white section-pad">
          <div className="container-as space-y-14">
            <SectionHeading
              eyebrow="Katalogu"
              title="Disa nga pjesët tona"
              subhead="E njëjta ProductCard do të përdoret në homepage dhe /katalogu."
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-shelf mx-auto">
              <ProductCard product={demoProduct} />
              <ProductCard product={demoProduct2} />
              <ProductCard product={demoProduct} compact />
              <ProductCard product={demoProduct2} compact />
            </div>
          </div>
        </section>

        {/* Nav note + stock photo sample */}
        <section className="surface-dark section-pad">
          <div className="container-as grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <SectionHeading
                eyebrow="Navigimi"
                title="SiteNav"
                subhead="Transparent mbi hero, solid + blur në scroll. Shiko shiritin lart në këtë faqe."
                align="left"
                tone="dark"
              />
            </FadeIn>
            <FadeIn delay={0.08}>
              <div className="relative aspect-[16/10] overflow-hidden rounded-media">
                <Image
                  src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1600&q=80"
                  alt="Placeholder workshop photography"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <p className="absolute bottom-4 left-4 right-4 text-caption text-white/80">
                  Stock placeholder (Unsplash) — do të përdoret në hero Phase 2
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="surface-white py-16">
          <div className="container-as-narrow text-center space-y-6">
            <p className="text-body text-as-secondary">
              Nëse ky sistem të duket i mirë, thuaj <strong className="text-as-dark">“vazhdo me Phase 2”</strong>{" "}
              dhe ndërtojmë homepage-in. Nëse do ndryshime (më pak dark, tipografi
              tjetër, etj.) — thuaji tani.
            </p>
            <Button href="/" variant="ghost">
              ← Kthehu në site
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
