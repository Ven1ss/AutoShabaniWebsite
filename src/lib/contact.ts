/** Shared contact endpoints for enquire CTAs */
export const CONTACT = {
  phoneDisplay: ["+383 49 238 509", "+383 49 848 760"],
  phoneTel: ["+38349238509", "+38349848760"],
  /** WhatsApp without + */
  whatsapp: "38349848760",
  email: "auto.shabaniii@gmail.com",
} as const;

export function buildEnquireMessage(opts: {
  sku: string;
  name: string;
  locale: "sq" | "en";
}): string {
  if (opts.locale === "sq") {
    return `Përshëndetje AUTO SHABANI, dua të pyes për: ${opts.name} (SKU: ${opts.sku}). A është i disponueshëm?`;
  }
  return `Hello AUTO SHABANI, I would like to enquire about: ${opts.name} (SKU: ${opts.sku}). Is it available?`;
}

export type CartEnquireLine = {
  sku: string;
  name: string;
  quantity: number;
  code?: string;
};

export function buildCartEnquireMessage(opts: {
  items: CartEnquireLine[];
  locale: "sq" | "en";
}): string {
  const lines = opts.items.map((item) => {
    const code = item.code ? ` · ${item.code}` : "";
    return `• ${item.name} — SKU ${item.sku}${code} × ${item.quantity}`;
  });

  if (opts.locale === "sq") {
    return [
      "Përshëndetje AUTO SHABANI,",
      "Dua të pyes për këto produkte:",
      "",
      ...lines,
      "",
      "A janë të disponueshme? Faleminderit.",
    ].join("\n");
  }

  return [
    "Hello AUTO SHABANI,",
    "I would like to enquire about these products:",
    "",
    ...lines,
    "",
    "Are they available? Thank you.",
  ].join("\n");
}

export function whatsappEnquireUrl(message: string): string {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function mailtoEnquireUrl(opts: {
  sku: string;
  name: string;
  message: string;
}): string {
  const subject = encodeURIComponent(`Enquiry: ${opts.name} (${opts.sku})`);
  const body = encodeURIComponent(opts.message);
  return `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
}

export function mailtoCartEnquireUrl(opts: {
  itemCount: number;
  message: string;
  locale: "sq" | "en";
}): string {
  const subject = encodeURIComponent(
    opts.locale === "sq"
      ? `Porosi / pyetje — ${opts.itemCount} produkte`
      : `Order enquiry — ${opts.itemCount} products`
  );
  const body = encodeURIComponent(opts.message);
  return `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
}
