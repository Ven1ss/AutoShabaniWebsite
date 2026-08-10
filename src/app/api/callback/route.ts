import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/client";
import { CONTACT } from "@/lib/contact";

type Body = {
  name?: string;
  phone?: string;
  note?: string;
  locale?: string;
};

/** Request a phone callback — stores enquiry + optional webhook. */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim();
  if (!name || !phone || phone.length < 6) {
    return NextResponse.json(
      { error: "Name and phone required" },
      { status: 400 }
    );
  }

  const locale = body.locale === "en" ? "en" : "sq";
  const note = (body.note ?? "").trim();
  const message =
    locale === "sq"
      ? `Kërkesë për telefonatë\nEmri: ${name}\nTel: ${phone}${note ? `\nShënim: ${note}` : ""}`
      : `Callback request\nName: ${name}\nPhone: ${phone}${note ? `\nNote: ${note}` : ""}`;

  const supabase = createSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("enquiry_orders").insert({
      locale,
      channel: "phone",
      message,
      customer_name: name,
      customer_phone: phone,
      items: [],
      status: "submitted",
    });
    if (error) console.error("[callback]", error.message);
  }

  const webhook = process.env.CALLBACK_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          note,
          locale,
          to: CONTACT.email,
        }),
      });
    } catch (err) {
      console.error("[callback webhook]", err);
    }
  }

  return NextResponse.json({ ok: true });
}
