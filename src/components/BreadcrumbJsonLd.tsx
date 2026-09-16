import { absoluteUrl } from "@/lib/seo";
import type { Crumb } from "@/components/Breadcrumbs";

export default function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  const list = items.filter((item) => item.label.trim());
  if (list.length === 0) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list.map((item, index) => {
      const entry: Record<string, unknown> = {
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
      };
      if (item.href) entry.item = absoluteUrl(item.href);
      return entry;
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
