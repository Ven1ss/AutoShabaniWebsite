import { redirect } from "next/navigation";
import SiteNav from "@/components/ui/SiteNav";
import Footer from "@/components/Footer";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { requireAdmin } from "@/lib/admin";

export default async function AdminPage() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/auth/login?next=/admin");

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-surface">
        <section className="mx-auto w-full max-w-wide px-[var(--page-pad-x)] pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.25rem))] pb-16">
          <AdminDashboard />
        </section>
      </main>
      <Footer />
    </>
  );
}
