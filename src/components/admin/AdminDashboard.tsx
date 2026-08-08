"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { StockStatus } from "@/lib/supabase/database.types";

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  sku: string;
  code: string | null;
  brand: string | null;
  description: string | null;
  description_en: string | null;
  category: string;
  image_url: string | null;
  selling_price: number | null;
  purchase_price: number | null;
  featured: boolean;
  stock_status: StockStatus;
  hidden_references: string | null;
};

const emptyForm = {
  id: "",
  name: "",
  name_en: "",
  sku: "",
  code: "",
  brand: "",
  description: "",
  description_en: "",
  category: "",
  image_url: "",
  selling_price: "0",
  purchase_price: "0",
  featured: false,
  stock_status: "on_request" as StockStatus,
  hidden_references: "",
};

export default function AdminDashboard() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<
    { id: string; channel: string; message: string; created_at: string }[]
  >([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/products");
    if (!res.ok) {
      setError("Unable to load products (are you an admin?)");
      return;
    }
    const data = await res.json();
    setProducts(data.products ?? []);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.orders) setOrders(data.orders);
      })
      .catch(() => undefined);
  }, [load]);

  function edit(product: AdminProduct) {
    setForm({
      id: product.id,
      name: product.name,
      name_en: product.name_en ?? "",
      sku: product.sku,
      code: product.code ?? "",
      brand: product.brand ?? "",
      description: product.description ?? "",
      description_en: product.description_en ?? "",
      category: product.category,
      image_url: product.image_url ?? "",
      selling_price: String(product.selling_price ?? 0),
      purchase_price: String(product.purchase_price ?? 0),
      featured: product.featured,
      stock_status: product.stock_status,
      hidden_references: product.hidden_references ?? "",
    });
    setMessage("");
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const payload = {
      id: form.id || undefined,
      name: form.name,
      name_en: form.name_en,
      sku: form.sku,
      code: form.code,
      brand: form.brand,
      description: form.description,
      description_en: form.description_en,
      category: form.category,
      image_url: form.image_url,
      selling_price: Number(form.selling_price),
      purchase_price: Number(form.purchase_price),
      featured: form.featured,
      stock_status: form.stock_status,
      hidden_references: form.hidden_references,
    };

    const res = await fetch("/api/admin/products", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Save failed");
      return;
    }

    setMessage("Saved");
    setForm(emptyForm);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/admin/products?id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("Delete failed");
      return;
    }
    await load();
  }

  async function onImport(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    body.set("file", file);
    const res = await fetch("/api/admin/import", { method: "POST", body });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Import failed");
      return;
    }
    const data = await res.json();
    setMessage(`Imported ${data.imported} products`);
    await load();
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-caption uppercase tracking-[0.16em] text-accent mb-1">
            Admin
          </p>
          <h1 className="text-2xl font-semibold text-as-dark tracking-tight">
            Products & enquiries
          </h1>
        </div>
        <Link
          href="/katalogu"
          className="text-sm font-medium text-accent hover:text-accent-deep"
        >
          View catalogue →
        </Link>
      </div>

      {error ? <p className="text-sm text-accent">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}

      <section className="rounded-card border border-steel-light bg-as-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{form.id ? "Edit product" : "New product"}</h2>
          {form.id ? (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="text-sm text-as-gray hover:text-accent"
            >
              Clear
            </button>
          ) : null}
        </div>
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {(
            [
              ["name", "Name (SQ)"],
              ["name_en", "Name (EN)"],
              ["sku", "SKU"],
              ["code", "Code"],
              ["brand", "Brand"],
              ["category", "Category"],
              ["image_url", "Image URL"],
              ["selling_price", "Selling price"],
              ["purchase_price", "Purchase price"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="space-y-1 text-sm">
              <span className="text-caption uppercase tracking-wider text-as-gray">
                {label}
              </span>
              <input
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                required={key === "name" || key === "sku" || key === "category"}
                className="w-full min-h-11 rounded-lg border border-steel-light px-3"
              />
            </label>
          ))}
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="text-caption uppercase tracking-wider text-as-gray">
              Description (SQ)
            </span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full rounded-lg border border-steel-light px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="text-caption uppercase tracking-wider text-as-gray">
              Description (EN)
            </span>
            <textarea
              value={form.description_en}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description_en: e.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-lg border border-steel-light px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-caption uppercase tracking-wider text-as-gray">
              Stock
            </span>
            <select
              value={form.stock_status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  stock_status: e.target.value as StockStatus,
                }))
              }
              className="w-full min-h-11 rounded-lg border border-steel-light px-3"
            >
              <option value="in_stock">In stock</option>
              <option value="on_request">On request</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm mt-6">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, featured: e.target.checked }))
              }
            />
            Featured on homepage
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-medium text-white disabled:opacity-50"
            >
              Save product
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-card border border-steel-light bg-as-white p-4 sm:p-6 space-y-3">
        <h2 className="text-lg font-semibold">Import CSV</h2>
        <p className="text-sm text-as-secondary">
          Columns: name, sku, category, code, brand, description, name_en,
          description_en, image_url, selling_price, purchase_price, featured,
          stock_status, hidden_references
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onImport(e.target.files?.[0] ?? null)}
          className="block text-sm"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Products{" "}
          <span className="text-as-gray font-normal tabular-nums">
            ({products.length})
          </span>
        </h2>
        <div className="overflow-x-auto rounded-card border border-steel-light bg-as-white">
          <table className="min-w-full text-sm">
            <thead className="bg-as-snow text-left text-caption uppercase tracking-wider text-as-gray">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Brand</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Flags</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-steel-light">
                  <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{p.brand}</td>
                  <td className="px-3 py-2 tabular-nums">{p.selling_price}</td>
                  <td className="px-3 py-2 text-caption text-as-gray">
                    {p.featured ? "featured · " : ""}
                    {p.stock_status}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => edit(p)}
                      className="text-accent hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="text-as-gray hover:text-accent"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Recent enquiries{" "}
          <span className="text-as-gray font-normal">({orders.length})</span>
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-as-gray">
            No saved enquiries yet (or migration not applied).
          </p>
        ) : (
          <ul className="space-y-2">
            {orders.map((o) => (
              <li
                key={o.id}
                className="rounded-card border border-steel-light bg-as-white p-3 text-sm"
              >
                <p className="text-caption uppercase tracking-wider text-as-gray mb-1">
                  {o.channel} · {new Date(o.created_at).toLocaleString()}
                </p>
                <p className="whitespace-pre-wrap text-as-secondary">
                  {o.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
