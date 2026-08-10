import { CONTACT } from "@/lib/contact";
import type { OrderItemRow, OrderRow } from "@/lib/supabase/database.types";

export type OrderEmailOrder = OrderRow & { items: OrderItemRow[] };

export type OrderEmailKind =
  | "created"
  | "paid"
  | "ready"
  | "cancelled"
  | "refunded"
  | "payment_failed";

export type SendOrderEmailResult =
  | { ok: true; skipped?: boolean; via?: string }
  | { ok: false; error: string };

function itemsSummary(order: OrderEmailOrder, locale: string): string {
  return order.items
    .map((item) => {
      const name = locale === "en" ? item.name_en : item.name_sq;
      return `• ${name} (${item.sku}) × ${item.qty} — €${Number(item.line_total).toFixed(2)}`;
    })
    .join("\n");
}

function buildPayload(kind: OrderEmailKind, order: OrderEmailOrder) {
  const locale = order.locale === "en" ? "en" : "sq";
  return {
    kind,
    type: "order_email",
    orderNumber: order.number,
    status: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    customer: {
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
    },
    locale,
    currency: order.currency,
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    notes: order.notes,
    itemsSummary: itemsSummary(order, locale),
    items: order.items.map((i) => ({
      sku: i.sku,
      name: locale === "en" ? i.name_en : i.name_sq,
      qty: i.qty,
      unitPrice: Number(i.unit_price),
      lineTotal: Number(i.line_total),
    })),
    to: order.customer_email,
    shopEmail: CONTACT.email,
  };
}

function subjectFor(kind: OrderEmailKind, orderNumber: string, locale: string) {
  const sq: Record<OrderEmailKind, string> = {
    created: `Porosia ${orderNumber} u pranua`,
    paid: `Pagesa për porosinë ${orderNumber} u konfirmua`,
    ready: `Porosia ${orderNumber} është gati për marrje`,
    cancelled: `Porosia ${orderNumber} u anulua`,
    refunded: `Rimbursim për porosinë ${orderNumber}`,
    payment_failed: `Pagesa dështoi për porosinë ${orderNumber}`,
  };
  const en: Record<OrderEmailKind, string> = {
    created: `Order ${orderNumber} received`,
    paid: `Payment confirmed for order ${orderNumber}`,
    ready: `Order ${orderNumber} is ready for pickup`,
    cancelled: `Order ${orderNumber} was cancelled`,
    refunded: `Refund for order ${orderNumber}`,
    payment_failed: `Payment failed for order ${orderNumber}`,
  };
  return (locale === "en" ? en : sq)[kind];
}

function textBody(kind: OrderEmailKind, order: OrderEmailOrder): string {
  const locale = order.locale === "en" ? "en" : "sq";
  const payload = buildPayload(kind, order);
  if (locale === "en") {
    return [
      `AUTO SHABANI — ${subjectFor(kind, order.number, locale)}`,
      "",
      `Customer: ${order.customer_name}`,
      `Phone: ${order.customer_phone}`,
      `Email: ${order.customer_email}`,
      `Status: ${order.status}`,
      `Payment: ${order.payment_method} / ${order.payment_status}`,
      `Total: €${Number(order.total).toFixed(2)}`,
      "",
      "Items:",
      payload.itemsSummary,
      order.notes ? `\nNotes: ${order.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `AUTO SHABANI — ${subjectFor(kind, order.number, locale)}`,
    "",
    `Klienti: ${order.customer_name}`,
    `Tel: ${order.customer_phone}`,
    `Email: ${order.customer_email}`,
    `Statusi: ${order.status}`,
    `Pagesa: ${order.payment_method} / ${order.payment_status}`,
    `Totali: €${Number(order.total).toFixed(2)}`,
    "",
    "Artikujt:",
    payload.itemsSummary,
    order.notes ? `\nShënim: ${order.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Notify customer / ops about an order lifecycle event. */
export async function sendOrderEmail(
  kind: OrderEmailKind,
  order: OrderEmailOrder
): Promise<SendOrderEmailResult> {
  const payload = buildPayload(kind, order);
  const locale = order.locale === "en" ? "en" : "sq";
  const webhook =
    process.env.ORDER_WEBHOOK_URL || process.env.CALLBACK_WEBHOOK_URL;

  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error("[sendOrderEmail webhook]", res.status, await res.text());
        return { ok: false, error: `Webhook HTTP ${res.status}` };
      }
      return { ok: true, via: "webhook" };
    } catch (err) {
      console.error("[sendOrderEmail webhook]", err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Webhook failed",
      };
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const from =
      process.env.ORDER_FROM_EMAIL?.trim() ||
      "AUTO SHABANI <onboarding@resend.dev>";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [order.customer_email],
          bcc: [CONTACT.email],
          subject: subjectFor(kind, order.number, locale),
          text: textBody(kind, order),
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("[sendOrderEmail resend]", res.status, body);
        return { ok: false, error: `Resend HTTP ${res.status}` };
      }
      return { ok: true, via: "resend" };
    } catch (err) {
      console.error("[sendOrderEmail resend]", err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Resend failed",
      };
    }
  }

  console.log("[sendOrderEmail skipped]", kind, order.number, {
    customer: order.customer_email,
    total: order.total,
    status: order.status,
    items: payload.itemsSummary,
  });
  return { ok: true, skipped: true };
}
