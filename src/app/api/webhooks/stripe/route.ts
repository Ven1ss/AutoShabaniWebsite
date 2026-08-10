import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendOrderEmail } from "@/lib/email";
import {
  getOrderById,
  getOrderByStripeSession,
  markOrderPaid,
  markPaymentFailed,
  restockOrderItems,
  updateOrderStatus,
} from "@/lib/order-service";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function readRawBody(request: Request): Promise<Buffer> {
  const ab = await request.arrayBuffer();
  return Buffer.from(ab);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!secret || !stripeKey) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 }
    );
  }

  if (!createServiceSupabaseClient()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);
    const body = await readRawBody(request);
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[stripe webhook verify]", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId =
          session.metadata?.order_id ||
          (
            await getOrderByStripeSession(session.id)
          )?.id;

        if (!orderId) {
          console.error("[stripe] no order for session", session.id);
          break;
        }

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        const result = await markOrderPaid(orderId, {
          checkoutSessionId: session.id,
          paymentIntentId,
        });

        if (result.ok && !result.alreadyPaid) {
          await sendOrderEmail("paid", result.order);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.order_id;
        let order = orderId ? await getOrderById(orderId) : null;

        if (!order && pi.id) {
          // Fallback: find via payment intent stored later — rare on first fail.
          const supabase = createServiceSupabaseClient();
          if (supabase) {
            const { data } = await supabase
              .from("orders")
              .select("id")
              .eq("stripe_payment_intent_id", pi.id)
              .maybeSingle();
            if (data?.id) order = await getOrderById(data.id);
          }
        }

        if (order) {
          const updated = await markPaymentFailed(order.id, {
            payment_intent: pi.id,
            code: pi.last_payment_error?.code ?? null,
          });
          if (updated) await sendOrderEmail("payment_failed", updated);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id ?? null;

        if (!paymentIntentId) break;

        const supabase = createServiceSupabaseClient();
        if (!supabase) break;

        const { data } = await supabase
          .from("orders")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle();

        if (!data?.id) break;

        const order = await getOrderById(data.id);
        if (!order) break;

        // Fully refunded → refunded; otherwise partially_refunded.
        const fullyRefunded =
          charge.refunded ||
          (charge.amount_refunded > 0 &&
            charge.amount_refunded >= charge.amount);

        if (order.payment_status === "refunded") {
          break; // idempotent
        }

        if (fullyRefunded) {
          const updated = await updateOrderStatus(order.id, "refunded", {
            skipTransitionCheck: true,
            detail: { charge_id: charge.id },
          });
          await restockOrderItems(order.id);
          if (updated.ok) await sendOrderEmail("refunded", updated.order);
        } else {
          await supabase
            .from("orders")
            .update({ payment_status: "partially_refunded" })
            .eq("id", order.id);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook handler]", event.type, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
