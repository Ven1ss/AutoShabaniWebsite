"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { CONTACT } from "@/lib/contact";
import { formatPrice, getLocalized, isSellableOnline } from "@/lib/products";
import { trackEvent } from "@/lib/analytics";

type PayMethod = "pickup" | "stripe";

export default function CheckoutForm() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, clearCart, closeCart, hydrated } = useCart();
  const cancelled = searchParams.get("cancelled") === "1";

  const sellableItems = useMemo(
    () =>
      items.filter((item) =>
        isSellableOnline({
          sellingPrice: item.sellingPrice,
          stockStatus: item.stockStatus,
          stockQty: item.stockQty,
        })
      ),
    [items]
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>("pickup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const subtotalLabel = formatPrice(subtotal, locale);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (sellableItems.length === 0) {
      setError(t.checkoutEmptySellable);
      return;
    }

    setBusy(true);
    trackEvent("checkout_submit", {
      method: paymentMethod,
      items: sellableItems.length,
    });

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          paymentMethod,
          notes: notes.trim() || undefined,
          customer: { name, phone, email },
          items: sellableItems.map((item) => ({
            productId: item.id,
            qty: item.quantity,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t.checkoutError);
        setBusy(false);
        return;
      }

      if (data.mode === "stripe" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.redirectUrl) {
        clearCart();
        closeCart();
        router.push(data.redirectUrl);
        return;
      }

      setError(t.checkoutError);
      setBusy(false);
    } catch {
      setError(t.checkoutError);
      setBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="h-40 animate-pulse rounded-xl border border-steel-light bg-as-snow" />
    );
  }

  if (sellableItems.length === 0) {
    return (
      <div className="rounded-xl border border-steel-light bg-as-white p-6 space-y-4">
        <p className="text-as-secondary">{t.checkoutEmptySellable}</p>
        <Link
          href="/katalogu"
          className="inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-5 text-sm font-medium text-white"
        >
          {t.cartBrowse}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-steel-light bg-as-white p-4 sm:p-6 space-y-5"
      >
        {cancelled ? (
          <p className="rounded-lg border border-steel-light bg-as-snow px-3 py-2 text-sm text-as-secondary">
            {t.checkoutCancelled}
          </p>
        ) : null}

        <div>
          <h2 className="text-lg font-semibold text-as-dark mb-1">
            {t.checkoutContactTitle}
          </h2>
          <p className="text-sm text-as-secondary">{t.checkoutContactHint}</p>
        </div>

        <label className="block space-y-1.5 text-sm">
          <span className="text-as-secondary">{t.checkoutName}</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full min-h-12 rounded-lg border border-steel-light bg-as-white px-3 text-base outline-none focus:border-as-dark/30"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-as-secondary">{t.checkoutPhone}</span>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="+383 ..."
            className="w-full min-h-12 rounded-lg border border-steel-light bg-as-white px-3 text-base outline-none focus:border-as-dark/30"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-as-secondary">{t.checkoutEmail}</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full min-h-12 rounded-lg border border-steel-light bg-as-white px-3 text-base outline-none focus:border-as-dark/30"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-as-secondary">{t.checkoutNotes}</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t.checkoutNotesPlaceholder}
            className="w-full rounded-lg border border-steel-light bg-as-white px-3 py-2 text-base outline-none focus:border-as-dark/30"
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-as-dark mb-1">
            {t.checkoutPaymentTitle}
          </legend>
          <label className="flex gap-3 items-start rounded-lg border border-steel-light p-3 cursor-pointer has-[:checked]:border-as-dark/40">
            <input
              type="radio"
              name="pay"
              checked={paymentMethod === "pickup"}
              onChange={() => setPaymentMethod("pickup")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-as-dark">
                {t.checkoutPayPickup}
              </span>
              <span className="block text-sm text-as-secondary">
                {t.checkoutPayPickupHint}
              </span>
            </span>
          </label>
          <label className="flex gap-3 items-start rounded-lg border border-steel-light p-3 cursor-pointer has-[:checked]:border-as-dark/40">
            <input
              type="radio"
              name="pay"
              checked={paymentMethod === "stripe"}
              onChange={() => setPaymentMethod("stripe")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-as-dark">
                {t.checkoutPayCard}
              </span>
              <span className="block text-sm text-as-secondary">
                {t.checkoutPayCardHint}
              </span>
            </span>
          </label>
        </fieldset>

        <div className="rounded-lg border border-steel-light bg-as-snow p-3 text-sm text-as-secondary space-y-1">
          <p className="font-medium text-as-dark">{t.checkoutPickupTitle}</p>
          <p>{t.checkoutPickupAddress}</p>
          <p>
            <a
              href={`tel:${CONTACT.phoneTel[0]}`}
              className="underline-offset-2 hover:underline"
            >
              {CONTACT.phoneDisplay[0]}
            </a>
          </p>
          <p className="text-caption">{t.checkoutVatNote}</p>
        </div>

        {error ? <p className="text-sm text-accent">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-50"
        >
          {busy
            ? t.checkoutSubmitting
            : paymentMethod === "stripe"
              ? t.checkoutSubmitCard
              : t.checkoutSubmitPickup}
        </button>
      </form>

      <aside className="rounded-xl border border-steel-light bg-as-white p-4 sm:p-5 h-fit space-y-4">
        <h2 className="text-sm font-semibold text-as-dark tracking-tight">
          {t.checkoutSummary}
        </h2>
        <ul className="space-y-3">
          {sellableItems.map((item) => {
            const nameLabel = getLocalized(item.name, locale);
            const line = formatPrice(
              item.sellingPrice == null
                ? null
                : item.sellingPrice * item.quantity,
              locale
            );
            return (
              <li key={item.slug} className="text-sm">
                <p className="font-medium text-as-dark line-clamp-2">
                  {nameLabel}
                </p>
                <p className="text-caption text-as-gray">
                  {item.sku} · ×{item.quantity}
                  {line ? ` · ${line}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
        {subtotalLabel ? (
          <div className="flex justify-between border-t border-steel-light pt-3 text-sm">
            <span className="text-as-secondary">{t.cartSubtotal}</span>
            <span className="font-semibold tabular-nums text-as-dark">
              {subtotalLabel}
            </span>
          </div>
        ) : null}
        <Link
          href="/katalogu"
          className="text-sm text-as-secondary underline-offset-2 hover:underline"
        >
          {t.checkoutContinueShopping}
        </Link>
      </aside>
    </div>
  );
}
