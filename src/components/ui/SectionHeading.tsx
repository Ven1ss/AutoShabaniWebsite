type Props = {
  eyebrow?: string;
  title: string;
  subhead?: string;
  align?: "center" | "left";
  tone?: "light" | "dark";
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  subhead,
  align = "center",
  tone = "light",
  className = "",
}: Props) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  const titleCls = tone === "dark" ? "text-as-white" : "text-as-dark";
  const subCls = tone === "dark" ? "text-white/70" : "text-as-secondary";
  const eyeCls = tone === "dark" ? "text-accent" : "text-accent";

  return (
    <div className={`max-w-3xl ${alignCls} ${className}`}>
      {eyebrow ? (
        <p className={`mb-3 text-caption font-semibold uppercase tracking-[0.14em] ${eyeCls}`}>
          {eyebrow}
        </p>
      ) : null}
      <h2 className={`text-section ${titleCls}`}>{title}</h2>
      {subhead ? (
        <p className={`mt-4 text-subhead ${subCls} max-w-2xl ${align === "center" ? "mx-auto" : ""}`}>
          {subhead}
        </p>
      ) : null}
    </div>
  );
}
