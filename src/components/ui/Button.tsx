import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Tone = "light" | "dark";

type Props = {
  children: ReactNode;
  variant?: Variant;
  tone?: Tone;
  href?: string;
  className?: string;
  fullWidth?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const base =
  "inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-control text-button transition-all duration-motion-fast ease-apple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

function classes(variant: Variant, tone: Tone, fullWidth?: boolean, className?: string) {
  const width = fullWidth ? "w-full" : "";
  const map: Record<Tone, Record<Variant, string>> = {
    light: {
      primary:
        "bg-accent text-white hover:bg-accent-deep focus-visible:outline-accent",
      secondary:
        "bg-as-dark text-white hover:bg-as-dark/85 focus-visible:outline-as-dark",
      ghost:
        "bg-transparent text-as-dark hover:bg-as-mist/80 focus-visible:outline-as-dark",
    },
    dark: {
      primary:
        "bg-accent text-white hover:bg-accent-deep focus-visible:outline-white",
      secondary:
        "bg-as-white text-as-dark hover:bg-as-snow focus-visible:outline-white",
      ghost:
        "bg-transparent text-as-white hover:bg-white/10 focus-visible:outline-white",
    },
  };
  return [base, map[tone][variant], width, className].filter(Boolean).join(" ");
}

export default function Button({
  children,
  variant = "primary",
  tone = "light",
  href,
  className,
  fullWidth,
  type = "button",
  ...rest
}: Props) {
  const cls = classes(variant, tone, fullWidth, className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
