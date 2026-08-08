import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/client";

type Body = {
  locale?: string;
  channel?: "whatsapp" | "email" | "phone" | "web";
  message?: string;
  items?: unknown;
  subtotal?: number | null;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message || message.length < 5) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const supabase = createSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { data, error } = await supabase
    .from("enquiry_orders")
    .insert({
      locale: body.locale === "en" ? "en" : "sq",
      channel: body.channel ?? "whatsapp",
      message,
      items: (body.items as never) ?? [],
      subtotal: body.subtotal ?? null,
      customer_name: body.customer_name ?? null,
      customer_phone: body.customer_phone ?? null,
      customer_email: body.customer_email ?? null,
      status: "submitted",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // Table may not exist until migration is applied — don't block WhatsApp.
    console.error("[enquiry-orders]", error.message);
    return NextResponse.json({ ok: true, skipped: true });
  }

  return NextResponse.json({ ok: true, id: data?.id });
}
