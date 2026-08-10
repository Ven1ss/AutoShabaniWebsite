"use client";

import { useCallback, useEffect, useState } from "react";
import { STATUS_FLOW, type OrderStatus } from "@/lib/orders";

type AdminOrder = {
  id: string;
  number: string;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total: number;
  created_at: string;
  items_summary: string;
  notes: string | null;
  items: {
    id: string;
    sku: string;
    name_sq: string;
    qty: number;
    unit_price: number;
    line_total: number;
  }[];
};

export default function AdminOrdersPanel() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Unable to load orders");
      return;
    }
    const data = await res.json();
    setOrders(data.orders ?? []);
    setError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: OrderStatus) {
    setBusyId(id);
    setError("");
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBusyId("");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Status update failed");
      return;
    }
    await load();
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Orders{" "}
          <span className="text-as-gray font-normal">({orders.length})</span>
        </h2>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm text-accent hover:underline"
        >
          Refresh
        </button>
      </div>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      {orders.length === 0 ? (
        <p className="text-sm text-as-gray">
          No orders yet (run migration 004 and place a test order).
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const next = STATUS_FLOW[order.status] ?? [];
            return (
              <li
                key={order.id}
                className="rounded-card border border-steel-light bg-as-white p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold tabular-nums text-as-dark">
                      {order.number}
                    </p>
                    <p className="text-caption text-as-gray">
                      {order.status} · {order.payment_method}/
                      {order.payment_status} ·{" "}
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums text-accent">
                    €{Number(order.total).toFixed(2)}
                  </p>
                </div>
                <p className="text-sm text-as-secondary">
                  {order.customer_name} · {order.customer_phone} ·{" "}
                  {order.customer_email}
                </p>
                <p className="text-sm text-as-dark">{order.items_summary}</p>
                {order.notes ? (
                  <p className="text-sm text-as-gray">Note: {order.notes}</p>
                ) : null}
                {next.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {next.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => void setStatus(order.id, status)}
                        className="inline-flex min-h-9 items-center rounded-md border border-steel-light px-3 text-caption font-medium hover:border-as-dark/40 disabled:opacity-50"
                      >
                        → {status}
                      </button>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
