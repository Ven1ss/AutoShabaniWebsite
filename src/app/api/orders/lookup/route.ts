import { NextResponse } from "next/server";
import {
  getOrderByNumber,
} from "@/lib/order-service";
import {
  normalizeOrderNumber,
  validateEmail,
} from "@/lib/orders";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type Body = {
  email?: string;
  orderNumber?: string;
};

/** Public order lookup — requires matching email + order number. */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!createServiceSupabaseClient()) {
    return NextResponse.json(
      { error: "Ordering is not configured" },
      { status: 503 }
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const orderNumber = normalizeOrderNumber(body.orderNumber ?? "");

  if (!validateEmail(email) || !orderNumber) {
    return NextResponse.json(
      { error: "Email and order number required" },
      { status: 400 }
    );
  }

  const order = await getOrderByNumber(orderNumber);
  if (!order || order.customer_email.toLowerCase() !== email) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    order: {
      number: order.number,
      status: order.status,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      locale: order.locale,
      currency: order.currency,
      customerName: order.customer_name,
      fulfillmentType: order.fulfillment_type,
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      notes: order.notes,
      paidAt: order.paid_at,
      readyAt: order.ready_at,
      completedAt: order.completed_at,
      cancelledAt: order.cancelled_at,
      createdAt: order.created_at,
      items: order.items.map((item) => ({
        sku: item.sku,
        slug: item.slug,
        nameSq: item.name_sq,
        nameEn: item.name_en,
        brand: item.brand,
        unitPrice: Number(item.unit_price),
        qty: item.qty,
        lineTotal: Number(item.line_total),
        imageUrl: item.image_url,
      })),
    },
  });
}
