import { Suspense } from "react";
import Link from "next/link";
import SiteNav from "@/components/ui/SiteNav";
import Footer from "@/components/Footer";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { getServerLocale } from "@/lib/locale";
import { translations } from "@/lib/translations";

export const metadata = {
  title: "Porosia | AUTO SHABANI",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const locale = await getServerLocale();
  const t = translations[locale];

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-[linear-gradient(180deg,#eef0f3_0%,#f5f5f7_28%,#f5f5f7_100%)]">
        <section className="mx-auto w-full max-w-wide px-[var(--page-pad-x)] pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.25rem))] pb-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-caption uppercase tracking-[0.16em] text-accent mb-1">
                AUTO SHABANI
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-as-dark tracking-tight">
                {t.checkoutTitle}
              </h1>
              <p className="mt-2 text-sm text-as-secondary max-w-xl">
                {t.checkoutSubtitle}
              </p>
            </div>
            <Link
              href="/porosia/kerko"
              className="text-sm text-as-secondary underline-offset-2 hover:underline"
            >
              {t.orderLookupLink}
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="h-40 animate-pulse rounded-xl border border-steel-light bg-as-snow" />
            }
          >
            <CheckoutForm />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
