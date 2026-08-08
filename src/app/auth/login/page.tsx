import { Suspense } from "react";
import SiteNav from "@/components/ui/SiteNav";
import Footer from "@/components/Footer";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-surface">
        <section className="mx-auto w-full max-w-md px-[var(--page-pad-x)] pt-[max(6rem,calc(env(safe-area-inset-top)+5rem))] pb-16">
          <h1 className="text-2xl font-semibold text-as-dark tracking-tight mb-2">
            Kyçu / Sign in
          </h1>
          <p className="text-sm text-as-secondary mb-8">
            Magic link via email — for ratings, comments, and admin.
          </p>
          <Suspense
            fallback={
              <div className="h-48 animate-pulse rounded-card border border-steel-light bg-as-white" />
            }
          >
            <LoginForm />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
