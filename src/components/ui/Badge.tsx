import type { ReactNode } from "react";

type Variant = "accent" | "neutral" | "dark" | "success";

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

const styles: Record<Variant, string> = {
  accent: "bg-accent-soft text-accent",
  neutral: "bg-as-mist text-as-secondary",
  dark: "bg-as-dark/8 text-as-dark",
  success: "bg-emerald-500/10 text-emerald-700",
};

export default function Badge({
  children,
  variant = "neutral",
  className = "",
}: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-control px-2.5 py-1 text-caption font-medium tracking-wide ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
