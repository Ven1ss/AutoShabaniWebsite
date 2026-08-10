import SiteNav from "@/components/ui/SiteNav";
import Footer from "@/components/Footer";
import OrderLookupForm from "@/components/checkout/OrderLookupForm";
import { getServerLocale } from "@/lib/locale";
import { translations } from "@/lib/translations";

export const metadata = {
  title: "Gjej porosinë | AUTO SHABANI",
  robots: { index: false, follow: false },
};

export default async function OrderLookupPage() {
  const locale = await getServerLocale();
  const t = translations[locale];

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-surface">
        <section className="mx-auto w-full max-w-md px-[var(--page-pad-x)] pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.25rem))] pb-16">
          <h1 className="text-2xl font-semibold text-as-dark tracking-tight mb-2">
            {t.orderLookupTitle}
          </h1>
          <p className="text-sm text-as-secondary mb-6">{t.orderLookupHint}</p>
          <OrderLookupForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
