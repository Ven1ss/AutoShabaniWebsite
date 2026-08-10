import { NextResponse } from "next/server";
import { sendOrderEmail } from "@/lib/email";
import {
  createOrder,
  resolveCheckoutLines,
  setOrderStripeSession,
} from "@/lib/order-service";
import {
  isPaymentMethod,
  validateEmail,
  validatePhone,
  type PaymentMethod,
} from "@/lib/orders";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type Body = {
  locale?: "sq" | "en";
  items?: { productId?: string; qty?: number }[];
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  notes?: string;
  paymentMethod?: PaymentMethod | string;
};

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

  const name = (body.customer?.name ?? "").trim();
  const phone = (body.customer?.phone ?? "").trim();
  const email = (body.customer?.email ?? "").trim();

  if (!name || !validatePhone(phone) || !validateEmail(email)) {
    return NextResponse.json(
      { error: "Name, phone, and email are required" },
      { status: 400 }
    );
  }

  if (!isPaymentMethod(body.paymentMethod)) {
    return NextResponse.json(
      { error: "paymentMethod must be stripe or pickup" },
      { status: 400 }
    );
  }

  const paymentMethod = body.paymentMethod;
  const locale = body.locale === "en" ? "en" : "sq";
  const rawItems = Array.isArray(body.items) ? body.items : [];

  const resolved = await resolveCheckoutLines(
    rawItems.map((i) => ({
      productId: String(i.productId ?? ""),
      qty: Number(i.qty ?? 0),
    }))
  );

  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  if (paymentMethod === "stripe" && !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Card payments not configured" },
      { status: 400 }
    );
  }

  const created = await createOrder({
    locale,
    customer: { name, phone, email },
    notes: body.notes ?? null,
    paymentMethod,
    lines: resolved.lines,
    subtotal: resolved.subtotal,
    decrementStock: paymentMethod === "pickup",
    initialStatus:
      paymentMethod === "pickup" ? "awaiting_pickup" : "pending_payment",
    paymentStatus: "unpaid",
  });

  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: 400 });
  }

  const order = created.order;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  if (paymentMethod === "pickup") {
    await sendOrderEmail("created", order);
    return NextResponse.json({
      ok: true,
      mode: "pickup",
      orderNumber: order.number,
      orderId: order.id,
      redirectUrl: `/porosia/sukses?order=${encodeURIComponent(order.number)}`,
    });
  }

  // Stripe Checkout — amounts come only from server-resolved lines.
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      success_url: `${siteUrl}/porosia/sukses?order=${encodeURIComponent(order.number)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/porosia?cancelled=1`,
      line_items: resolved.lines.map((line) => ({
        quantity: line.qty,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(line.unitPrice * 100),
          product_data: {
            name: locale === "en" ? line.nameEn : line.nameSq,
            metadata: { sku: line.sku, product_id: line.productId },
          },
        },
      })),
      metadata: {
        order_id: order.id,
        order_number: order.number,
      },
    });

    if (session.id) {
      await setOrderStripeSession(order.id, session.id);
    }

    return NextResponse.json({
      ok: true,
      mode: "stripe",
      orderNumber: order.number,
      orderId: order.id,
      checkoutUrl: session.url,
    });
  } catch (err) {
    console.error("[checkout stripe]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not start card checkout",
      },
      { status: 502 }
    );
  }
}
