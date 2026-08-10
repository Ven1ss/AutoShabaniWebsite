import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildCartEnquireMessage,
  whatsappEnquireUrl,
} from "@/lib/contact";

type Item = {
  sku: string;
  name: string;
  quantity: number;
  code?: string;
  slug?: string;
  sellingPrice?: number | null;
};

type Body = {
  locale?: "sq" | "en";
  items?: Item[];
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  /** Prefer Stripe when configured */
  preferPaid?: boolean;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Cart empty" }, { status: 400 });
  }

  const locale = body.locale === "en" ? "en" : "sq";
  const message = buildCartEnquireMessage({
    locale,
    items: items.map((i) => ({
      sku: i.sku,
      name: i.name,
      quantity: i.quantity,
      code: i.code,
    })),
  });

  const subtotal = items.reduce((sum, item) => {
    const price = item.sellingPrice;
    if (price == null || Number.isNaN(price)) return sum;
    return sum + price * item.quantity;
  }, 0);

  const supabase =
    (await createServerSupabaseClient()) || createSupabaseClient();

  let orderId: string | null = null;
  if (supabase) {
    const { data, error } = await supabase
      .from("enquiry_orders")
      .insert({
        locale,
        channel: body.preferPaid ? "web" : "whatsapp",
        message,
        items: items as never,
        subtotal: subtotal || null,
        customer_name: body.customer_name ?? null,
        customer_email: body.customer_email ?? null,
        customer_phone: body.customer_phone ?? null,
        status: "submitted",
      })
      .select("id")
      .maybeSingle();
    if (!error) orderId = data?.id ?? null;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  if (body.preferPaid && stripeKey && subtotal > 0) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${siteUrl}/porosia/sukses?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/katalogu`,
        customer_email: body.customer_email || undefined,
        line_items: items
          .filter((i) => i.sellingPrice != null && i.sellingPrice > 0)
          .map((i) => ({
            quantity: i.quantity,
            price_data: {
              currency: "eur",
              unit_amount: Math.round(Number(i.sellingPrice) * 100),
              product_data: {
                name: i.name,
                metadata: { sku: i.sku },
              },
            },
          })),
        metadata: {
          enquiry_order_id: orderId ?? "",
        },
      });

      return NextResponse.json({
        ok: true,
        mode: "stripe",
        orderId,
        checkoutUrl: session.url,
      });
    } catch (err) {
      console.error("[checkout stripe]", err);
    }
  }

  return NextResponse.json({
    ok: true,
    mode: "whatsapp",
    orderId,
    whatsappUrl: whatsappEnquireUrl(message),
  });
}
