import Link from "next/link";

export type Crumb = {
  href?: string;
  label: string;
};

type Props = {
  items: Crumb[];
};

export default function Breadcrumbs({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-3 sm:mb-4">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-as-secondary">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex min-w-0 items-center gap-x-2">
              {index > 0 ? (
                <span className="text-as-mist" aria-hidden>
                  ›
                </span>
              ) : null}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="truncate hover:text-as-dark transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="truncate text-as-dark"
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
