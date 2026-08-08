/** URL-safe slug from product name / SKU. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildProductSlug(opts: {
  name: string;
  sku: string;
  id?: string;
}): string {
  const fromName = slugify(opts.name);
  const fromSku = slugify(opts.sku);
  if (fromName && fromSku) return `${fromName}-${fromSku}`.slice(0, 100);
  if (fromSku) return fromSku;
  if (fromName) return fromName;
  return opts.id ?? "product";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
