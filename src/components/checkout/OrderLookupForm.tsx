"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/products";

type LookupOrder = {
  number: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  items: {
    sku: string;
    nameSq: string;
    nameEn: string;
    qty: number;
    lineTotal: number;
  }[];
};

export default function OrderLookupForm() {
  const { t, locale } = useLanguage();
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<LookupOrder | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, orderNumber }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t.orderLookupError);
        setBusy(false);
        return;
      }
      setOrder(data.order as LookupOrder);
    } catch {
      setError(t.orderLookupError);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-steel-light bg-as-white p-4 sm:p-6 space-y-4"
      >
        <label className="block space-y-1.5 text-sm">
          <span className="text-as-secondary">{t.checkoutEmail}</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-12 rounded-lg border border-steel-light px-3 text-base"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-as-secondary">{t.orderNumberLabel}</span>
          <input
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="AS-2026-000123"
            className="w-full min-h-12 rounded-lg border border-steel-light px-3 text-base font-mono"
          />
        </label>
        {error ? <p className="text-sm text-accent">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accent px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? t.checkoutSubmitting : t.orderLookupSubmit}
        </button>
      </form>

      {order ? (
        <div className="rounded-xl border border-steel-light bg-as-white p-5 space-y-3">
          <p className="text-xl font-semibold tabular-nums">{order.number}</p>
          <p className="text-sm text-as-secondary">
            {t.orderStatusLabel}:{" "}
            <span className="text-as-dark font-medium">{order.status}</span>
          </p>
          <p className="text-sm text-as-secondary">
            {formatPrice(order.total, locale)}
          </p>
          <ul className="text-sm space-y-1 border-t border-steel-light pt-3">
            {order.items.map((item) => (
              <li
                key={`${item.sku}-${item.qty}`}
                className="flex justify-between gap-2"
              >
                <span>
                  {locale === "en" ? item.nameEn : item.nameSq} ×{item.qty}
                </span>
                <span className="tabular-nums text-as-secondary">
                  {formatPrice(item.lineTotal, locale)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
