import Link from "next/link";
import SiteNav from "@/components/ui/SiteNav";
import Footer from "@/components/Footer";
import { getServerLocale } from "@/lib/locale";
import { translations } from "@/lib/translations";

export default async function OrderSuccessPage() {
  const locale = await getServerLocale();
  const t = translations[locale];

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-surface">
        <section className="mx-auto w-full max-w-lg px-[var(--page-pad-x)] pt-[max(6rem,calc(env(safe-area-inset-top)+5rem))] pb-16 text-center">
          <h1 className="text-2xl font-semibold text-as-dark tracking-tight mb-3">
            {t.orderSuccessTitle}
          </h1>
          <p className="text-as-secondary mb-8">{t.orderSuccessBody}</p>
          <Link
            href="/katalogu"
            className="inline-flex min-h-12 items-center justify-center rounded-control bg-accent px-6 text-sm font-medium text-white"
          >
            {t.catalogueBrowseAll}
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
