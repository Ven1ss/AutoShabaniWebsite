import Link from "next/link";
import SiteNav from "@/components/ui/SiteNav";
import Footer from "@/components/Footer";
import ClearCartOnSuccess from "@/components/checkout/ClearCartOnSuccess";
import { CONTACT } from "@/lib/contact";
import { getServerLocale } from "@/lib/locale";
import {
  getOrderByNumber,
  getOrderByStripeSession,
} from "@/lib/order-service";
import { formatPrice } from "@/lib/products";
import { translations } from "@/lib/translations";

type Props = {
  searchParams?: Promise<{ order?: string; session_id?: string }>;
};

export default async function OrderSuccessPage({ searchParams }: Props) {
  const locale = await getServerLocale();
  const t = translations[locale];
  const params = (await searchParams) ?? {};
  const orderNumber = params.order?.trim();
  const sessionId = params.session_id?.trim();

  let order =
    (orderNumber ? await getOrderByNumber(orderNumber).catch(() => null) : null) ??
    (sessionId
      ? await getOrderByStripeSession(sessionId).catch(() => null)
      : null);

  // Stripe webhook may lag slightly — soft wait by re-reading once is enough for UI.
  if (!order && sessionId) {
    await new Promise((r) => setTimeout(r, 800));
    order = await getOrderByStripeSession(sessionId).catch(() => null);
  }

  const totalLabel = order
    ? formatPrice(Number(order.total), locale)
    : null;

  return (
    <>
      <SiteNav />
      <ClearCartOnSuccess orderNumber={order?.number} />
      <main className="min-h-screen bg-surface">
        <section className="mx-auto w-full max-w-lg px-[var(--page-pad-x)] pt-[max(6rem,calc(env(safe-area-inset-top)+5rem))] pb-16">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-as-dark tracking-tight mb-3">
              {t.orderSuccessTitle}
            </h1>
            <p className="text-as-secondary">{t.orderSuccessBody}</p>
          </div>

          {order ? (
            <div className="rounded-xl border border-steel-light bg-as-white p-5 space-y-4 mb-8 text-left">
              <div>
                <p className="text-caption uppercase tracking-wider text-as-gray">
                  {t.orderNumberLabel}
                </p>
                <p className="text-xl font-semibold tabular-nums text-as-dark">
                  {order.number}
                </p>
              </div>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-as-secondary">{t.orderStatusLabel}</dt>
                  <dd className="font-medium text-as-dark">{order.status}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-as-secondary">{t.orderPaymentLabel}</dt>
                  <dd className="font-medium text-as-dark">
                    {order.payment_method === "stripe"
                      ? t.checkoutPayCard
                      : t.checkoutPayPickup}
                    {order.payment_status === "paid" ? ` · ${t.orderPaid}` : ""}
                  </dd>
                </div>
                {totalLabel ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-as-secondary">{t.cartSubtotal}</dt>
                    <dd className="font-semibold tabular-nums text-accent">
                      {totalLabel}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <ul className="border-t border-steel-light pt-3 space-y-2 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span className="text-as-dark">
                      {locale === "en" ? item.name_en : item.name_sq} ×{item.qty}
                    </span>
                    <span className="tabular-nums text-as-secondary">
                      {formatPrice(Number(item.line_total), locale)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-steel-light pt-3 text-sm text-as-secondary space-y-1">
                <p className="font-medium text-as-dark">{t.checkoutPickupTitle}</p>
                <p>{t.checkoutPickupAddress}</p>
                <p>{t.orderBringNumber}</p>
                <p>
                  <a
                    href={`tel:${CONTACT.phoneTel[0]}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {CONTACT.phoneDisplay[0]}
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-as-secondary text-center mb-8">
              {t.orderSuccessPending}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/katalogu"
              className="inline-flex min-h-12 items-center justify-center rounded-control bg-accent px-6 text-sm font-medium text-white"
            >
              {t.catalogueBrowseAll}
            </Link>
            <Link
              href="/porosia/kerko"
              className="inline-flex min-h-12 items-center justify-center rounded-control border border-steel-light px-6 text-sm font-medium text-as-dark"
            >
              {t.orderLookupLink}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
