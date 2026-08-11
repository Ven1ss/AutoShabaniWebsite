/**
 * Server-only order service.
 * Uses createServiceSupabaseClient — never import from client components.
 */
import {
  isSellableOnline,
  maxOrderQty,
  type StockStatus,
} from "@/lib/products";
import {
  canTransition,
  normalizeOrderNumber,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/orders";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type {
  Json,
  OrderEventRow,
  OrderItemRow,
  OrderRow,
} from "@/lib/supabase/database.types";

export type CheckoutLineInput = {
  productId: string;
  qty: number;
};

export type ResolvedCheckoutLine = {
  productId: string;
  slug: string;
  sku: string;
  nameSq: string;
  nameEn: string;
  brand: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  imageUrl: string | null;
};

export type ResolveCheckoutResult =
  | { ok: true; lines: ResolvedCheckoutLine[]; subtotal: number }
  | { ok: false; error: string; code?: string };

export type CreateOrderInput = {
  locale: "sq" | "en";
  customer: { name: string; phone: string; email: string };
  notes?: string | null;
  paymentMethod: PaymentMethod;
  lines: ResolvedCheckoutLine[];
  subtotal: number;
  userId?: string | null;
  /** When true, decrement stock immediately (pickup / already-paid). */
  decrementStock?: boolean;
  initialStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
};

export type OrderWithItems = OrderRow & {
  items: OrderItemRow[];
};

type ProductCheckoutRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  name_en: string | null;
  brand: string | null;
  image_url: string | null;
  selling_price: number | null;
  stock_status: StockStatus;
  stock_qty: number | null;
};

function requireServiceClient() {
  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured");
  }
  return supabase;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function resolveCheckoutLines(
  items: CheckoutLineInput[]
): Promise<ResolveCheckoutResult> {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Cart empty", code: "empty" };
  }

  const merged = new Map<string, number>();
  for (const item of items) {
    const id = typeof item.productId === "string" ? item.productId.trim() : "";
    const qty = Math.floor(Number(item.qty));
    if (!id || !Number.isFinite(qty) || qty < 1) {
      return { ok: false, error: "Invalid cart line", code: "invalid_line" };
    }
    merged.set(id, (merged.get(id) ?? 0) + qty);
  }

  const ids = [...merged.keys()];
  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, sku, name, name_en, brand, image_url, selling_price, stock_status, stock_qty"
    )
    .in("id", ids);

  if (error) {
    return { ok: false, error: error.message, code: "db" };
  }

  const rows = (data ?? []) as ProductCheckoutRow[];
  const byId = new Map(rows.map((r) => [r.id, r]));

  const lines: ResolvedCheckoutLine[] = [];
  let subtotal = 0;

  for (const id of ids) {
    const product = byId.get(id);
    if (!product) {
      return {
        ok: false,
        error: `Product not found: ${id}`,
        code: "not_found",
      };
    }

    const sellable = isSellableOnline({
      sellingPrice: product.selling_price,
      stockStatus: product.stock_status,
      stockQty: product.stock_qty,
    });

    if (!sellable || product.selling_price == null) {
      return {
        ok: false,
        error: `Product not available online: ${product.sku}`,
        code: "not_sellable",
      };
    }

    const requested = merged.get(id) ?? 0;
    const max = maxOrderQty({
      stockQty: product.stock_qty,
    });
    if (max < 1) {
      return {
        ok: false,
        error: `Product out of stock: ${product.sku}`,
        code: "no_qty",
      };
    }

    const qty = Math.min(requested, max);
    const unitPrice = roundMoney(Number(product.selling_price));
    const lineTotal = roundMoney(unitPrice * qty);
    subtotal = roundMoney(subtotal + lineTotal);

    lines.push({
      productId: product.id,
      slug: product.slug,
      sku: product.sku,
      nameSq: product.name,
      nameEn: product.name_en || product.name,
      brand: product.brand,
      unitPrice,
      qty,
      lineTotal,
      imageUrl: product.image_url,
    });
  }

  if (lines.length === 0 || subtotal <= 0) {
    return { ok: false, error: "Nothing to checkout", code: "empty" };
  }

  return { ok: true, lines, subtotal };
}

async function appendEvent(
  orderId: string,
  kind: string,
  detail: Record<string, unknown> = {}
): Promise<void> {
  const supabase = requireServiceClient();
  const { error } = await supabase.from("order_events").insert({
    order_id: orderId,
    kind,
    detail: detail as Json,
  });
  if (error) console.error("[order_events]", error.message);
}

async function decrementLines(
  lines: Array<{ productId: string | null; qty: number }>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = requireServiceClient();
  for (const line of lines) {
    if (!line.productId) continue;
    const { data, error } = await supabase.rpc("decrement_product_stock", {
      p_product_id: line.productId,
      p_qty: line.qty,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    if (data === false) {
      return {
        ok: false,
        error: `Insufficient stock for product ${line.productId}`,
      };
    }
  }
  return { ok: true };
}

export async function createOrder(
  input: CreateOrderInput
): Promise<
  | { ok: true; order: OrderWithItems }
  | { ok: false; error: string }
> {
  const supabase = requireServiceClient();

  const paymentMethod = input.paymentMethod;
  const initialStatus: OrderStatus =
    input.initialStatus ??
    (paymentMethod === "pickup" ? "awaiting_pickup" : "pending_payment");
  const paymentStatus: PaymentStatus =
    input.paymentStatus ?? "unpaid";
  const shouldDecrement =
    input.decrementStock ?? paymentMethod === "pickup";

  const { data: numberData, error: numberError } = await supabase.rpc(
    "next_order_number"
  );
  if (numberError || typeof numberData !== "string") {
    return {
      ok: false,
      error: numberError?.message ?? "Could not allocate order number",
    };
  }

  if (shouldDecrement) {
    const stock = await decrementLines(
      input.lines.map((l) => ({ productId: l.productId, qty: l.qty }))
    );
    if (!stock.ok) return stock;
  }

  const total = roundMoney(input.subtotal);

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .insert({
      number: numberData,
      status: initialStatus,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      locale: input.locale,
      currency: "eur",
      customer_name: input.customer.name.trim(),
      customer_phone: input.customer.phone.trim(),
      customer_email: input.customer.email.trim().toLowerCase(),
      fulfillment_type: "pickup",
      notes: input.notes?.trim() || null,
      subtotal: total,
      total,
      user_id: input.userId ?? null,
    })
    .select("*")
    .single();

  if (orderError || !orderRow) {
    return {
      ok: false,
      error: orderError?.message ?? "Failed to create order",
    };
  }

  const order = orderRow as OrderRow;

  const itemRows = input.lines.map((line) => ({
    order_id: order.id,
    product_id: line.productId,
    slug: line.slug,
    sku: line.sku,
    name_sq: line.nameSq,
    name_en: line.nameEn,
    brand: line.brand,
    unit_price: line.unitPrice,
    qty: line.qty,
    line_total: line.lineTotal,
    image_url: line.imageUrl,
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from("order_items")
    .insert(itemRows)
    .select("*");

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { ok: false, error: itemsError.message };
  }

  await appendEvent(order.id, "created", {
    payment_method: paymentMethod,
    status: initialStatus,
    stock_decremented: shouldDecrement,
    item_count: input.lines.length,
  });

  return {
    ok: true,
    order: {
      ...order,
      items: (insertedItems ?? []) as OrderItemRow[],
    },
  };
}

async function loadOrderItems(orderId: string): Promise<OrderItemRow[]> {
  const supabase = requireServiceClient();
  const { data } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("sku", { ascending: true });
  return (data ?? []) as OrderItemRow[];
}

async function hydrate(order: OrderRow | null): Promise<OrderWithItems | null> {
  if (!order) return null;
  const items = await loadOrderItems(order.id);
  return { ...order, items };
}

export async function getOrderById(
  id: string
): Promise<OrderWithItems | null> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return hydrate((data as OrderRow | null) ?? null);
}

export async function getOrderByNumber(
  number: string
): Promise<OrderWithItems | null> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("number", normalizeOrderNumber(number))
    .maybeSingle();
  return hydrate((data as OrderRow | null) ?? null);
}

export async function getOrderByStripeSession(
  sessionId: string
): Promise<OrderWithItems | null> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  return hydrate((data as OrderRow | null) ?? null);
}

export async function listOrders(limit = 50): Promise<OrderWithItems[]> {
  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(200, Math.max(1, limit)));

  if (error || !data) return [];

  const orders = data as OrderRow[];
  const ids = orders.map((o) => o.id);
  if (ids.length === 0) return [];

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", ids);

  const byOrder = new Map<string, OrderItemRow[]>();
  for (const item of (items ?? []) as OrderItemRow[]) {
    const list = byOrder.get(item.order_id) ?? [];
    list.push(item);
    byOrder.set(item.order_id, list);
  }

  return orders.map((o) => ({
    ...o,
    items: byOrder.get(o.id) ?? [],
  }));
}

export type UpdateOrderStatusMeta = {
  detail?: Record<string, unknown>;
  skipTransitionCheck?: boolean;
};

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  meta?: UpdateOrderStatusMeta
): Promise<
  | { ok: true; order: OrderWithItems }
  | { ok: false; error: string }
> {
  const existing = await getOrderById(id);
  if (!existing) return { ok: false, error: "Order not found" };

  if (
    !meta?.skipTransitionCheck &&
    !canTransition(existing.status as OrderStatus, status)
  ) {
    return {
      ok: false,
      error: `Cannot transition from ${existing.status} to ${status}`,
    };
  }

  const patch: Partial<OrderRow> = { status };
  const now = new Date().toISOString();
  if (status === "ready") patch.ready_at = now;
  if (status === "completed") patch.completed_at = now;
  if (status === "cancelled" || status === "refunded") {
    patch.cancelled_at = existing.cancelled_at ?? now;
  }
  if (status === "refunded") {
    patch.payment_status = "refunded";
  }

  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Update failed" };
  }

  await appendEvent(id, "status_changed", {
    from: existing.status,
    to: status,
    ...(meta?.detail ?? {}),
  });

  return {
    ok: true,
    order: {
      ...(data as OrderRow),
      items: existing.items,
    },
  };
}

export async function markOrderPaid(
  id: string,
  stripe: {
    checkoutSessionId?: string | null;
    paymentIntentId?: string | null;
  }
): Promise<
  | { ok: true; order: OrderWithItems; alreadyPaid: boolean }
  | { ok: false; error: string }
> {
  const existing = await getOrderById(id);
  if (!existing) return { ok: false, error: "Order not found" };

  if (existing.payment_status === "paid") {
    return { ok: true, order: existing, alreadyPaid: true };
  }

  // Decrement stock for Stripe path (pickup already decremented on create).
  if (existing.payment_method === "stripe") {
    const stock = await decrementLines(
      existing.items.map((i) => ({
        productId: i.product_id,
        qty: i.qty,
      }))
    );
    if (!stock.ok) {
      // Still mark paid but log — inventory may need manual fix.
      console.error("[markOrderPaid stock]", stock.error);
      await appendEvent(id, "stock_decrement_failed", { error: stock.error });
    } else {
      await appendEvent(id, "stock_decremented", {});
    }
  }

  const nextStatus: OrderStatus =
    existing.fulfillment_type === "pickup" ? "awaiting_pickup" : "paid";

  const now = new Date().toISOString();
  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: now,
      status: nextStatus,
      stripe_checkout_session_id:
        stripe.checkoutSessionId ?? existing.stripe_checkout_session_id,
      stripe_payment_intent_id:
        stripe.paymentIntentId ?? existing.stripe_payment_intent_id,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to mark paid" };
  }

  await appendEvent(id, "paid", {
    stripe_checkout_session_id: stripe.checkoutSessionId ?? null,
    stripe_payment_intent_id: stripe.paymentIntentId ?? null,
    status: nextStatus,
  });

  return {
    ok: true,
    order: { ...(data as OrderRow), items: existing.items },
    alreadyPaid: false,
  };
}

export async function setOrderStripeSession(
  orderId: string,
  sessionId: string
): Promise<void> {
  const supabase = requireServiceClient();
  const { error } = await supabase
    .from("orders")
    .update({ stripe_checkout_session_id: sessionId })
    .eq("id", orderId);
  if (error) console.error("[setOrderStripeSession]", error.message);
}

export async function restockOrderItems(
  orderId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const order = await getOrderById(orderId);
  if (!order) return { ok: false, error: "Order not found" };

  const supabase = requireServiceClient();
  const { data: events } = await supabase
    .from("order_events")
    .select("kind, detail")
    .eq("order_id", orderId);

  const kinds = new Set((events ?? []).map((e) => e.kind));
  if (kinds.has("restocked")) {
    return { ok: true };
  }

  const created = (events ?? []).find((e) => e.kind === "created");
  const createdDetail =
    created?.detail && typeof created.detail === "object"
      ? (created.detail as Record<string, unknown>)
      : {};
  const wasDecremented =
    kinds.has("stock_decremented") || createdDetail.stock_decremented === true;

  if (!wasDecremented) {
    await appendEvent(orderId, "restock_skipped", {
      reason: "stock_was_not_decremented",
    });
    return { ok: true };
  }

  for (const item of order.items) {
    if (!item.product_id) continue;
    const { data: product } = await supabase
      .from("products")
      .select("id, stock_qty, stock_status")
      .eq("id", item.product_id)
      .maybeSingle();

    if (!product) continue;
    // Only restock tracked inventory.
    if (product.stock_qty == null) continue;

    const nextQty = Number(product.stock_qty) + item.qty;
    const { error } = await supabase
      .from("products")
      .update({
        stock_qty: nextQty,
        stock_status:
          nextQty > 0 && product.stock_status === "out_of_stock"
            ? "in_stock"
            : product.stock_status,
      })
      .eq("id", item.product_id);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  await appendEvent(orderId, "restocked", {
    item_count: order.items.length,
  });

  return { ok: true };
}

export async function markPaymentFailed(
  id: string,
  detail?: Record<string, unknown>
): Promise<OrderWithItems | null> {
  const existing = await getOrderById(id);
  if (!existing) return null;
  if (existing.payment_status === "paid") return existing;

  const supabase = requireServiceClient();
  const { data } = await supabase
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("id", id)
    .select("*")
    .single();

  await appendEvent(id, "payment_failed", detail ?? {});
  if (!data) return existing;
  return { ...(data as OrderRow), items: existing.items };
}

export type { OrderEventRow };
