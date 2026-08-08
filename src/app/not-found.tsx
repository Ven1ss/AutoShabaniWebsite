import Link from "next/link";
import SiteNav from "@/components/ui/SiteNav";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-surface">
        <section className="mx-auto flex w-full max-w-wide flex-col items-start px-[var(--page-pad-x)] pt-[max(6.5rem,calc(env(safe-area-inset-top)+5rem))] pb-20">
          <p className="text-caption uppercase tracking-[0.18em] text-accent mb-3">
            404
          </p>
          <h1 className="text-title text-as-dark mb-3">Faqja nuk u gjet</h1>
          <p className="text-body text-as-secondary mb-8 max-w-md">
            Kjo faqe nuk ekziston. Kthehu te katalogu ose faqja kryesore.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/katalogu"
              className="inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-5 text-sm font-medium text-white hover:bg-accent-deep transition-colors"
            >
              Katalogu
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-control border border-steel-light bg-as-white px-5 text-sm font-medium text-as-dark hover:border-as-dark/30 transition-colors"
            >
              Ballina
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
