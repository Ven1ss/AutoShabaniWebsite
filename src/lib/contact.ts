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
