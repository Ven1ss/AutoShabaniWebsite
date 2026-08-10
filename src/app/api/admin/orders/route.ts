import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { sendOrderEmail } from "@/lib/email";
import {
  listOrders,
  restockOrderItems,
  updateOrderStatus,
} from "@/lib/order-service";
import { isOrderStatus } from "@/lib/orders";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

function summarizeOrder(
  order: Awaited<ReturnType<typeof listOrders>>[number]
) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    locale: order.locale,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_email: order.customer_email,
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    notes: order.notes,
    created_at: order.created_at,
    paid_at: order.paid_at,
    ready_at: order.ready_at,
    completed_at: order.completed_at,
    cancelled_at: order.cancelled_at,
    items_summary: order.items
      .map((i) => `${i.sku}×${i.qty}`)
      .join(", "),
    items: order.items.map((i) => ({
      id: i.id,
      sku: i.sku,
      name_sq: i.name_sq,
      name_en: i.name_en,
      qty: i.qty,
      unit_price: Number(i.unit_price),
      line_total: Number(i.line_total),
    })),
  };
}

export async function GET() {
  const { supabase, isAdmin } = await requireAdmin();
  if (!supabase || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prefer service client for consistent joins; fall back to admin session.
  if (!createServiceSupabaseClient()) {
    return NextResponse.json(
      { error: "Service role required for orders" },
      { status: 503 }
    );
  }

  const orders = await listOrders(50);
  return NextResponse.json({
    orders: orders.map(summarizeOrder),
  });
}

type PatchBody = {
  id?: string;
  status?: string;
};

export async function PATCH(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!supabase || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!createServiceSupabaseClient()) {
    return NextResponse.json(
      { error: "Service role required for orders" },
      { status: 503 }
    );
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  if (!id || !isOrderStatus(body.status)) {
    return NextResponse.json(
      { error: "id and valid status required" },
      { status: 400 }
    );
  }

  const status = body.status;
  const updated = await updateOrderStatus(id, status);
  if (!updated.ok) {
    return NextResponse.json({ error: updated.error }, { status: 400 });
  }

  if (status === "cancelled" || status === "refunded") {
    await restockOrderItems(id);
  }

  if (
    status === "refunded" &&
    updated.order.payment_method === "stripe" &&
    updated.order.stripe_payment_intent_id &&
    process.env.STRIPE_SECRET_KEY
  ) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      await stripe.refunds.create({
        payment_intent: updated.order.stripe_payment_intent_id,
      });
    } catch (err) {
      console.error("[admin refund]", err);
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? `Status updated but Stripe refund failed: ${err.message}`
              : "Status updated but Stripe refund failed",
          order: summarizeOrder(updated.order),
        },
        { status: 502 }
      );
    }
  }

  if (status === "ready") {
    await sendOrderEmail("ready", updated.order);
  } else if (status === "cancelled") {
    await sendOrderEmail("cancelled", updated.order);
  } else if (status === "refunded") {
    await sendOrderEmail("refunded", updated.order);
  }

  return NextResponse.json({
    ok: true,
    order: summarizeOrder(updated.order),
  });
}
