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
  const eyeCls = tone === "dark" ? "text-white/55" : "text-as-gray";

  return (
    <div className={`max-w-2xl ${alignCls} ${className}`}>
      {eyebrow ? (
        <p className={`mb-2 text-sm font-medium ${eyeCls}`}>{eyebrow}</p>
      ) : null}
      <h2 className={`text-section ${titleCls}`}>{title}</h2>
      {subhead ? (
        <p
          className={`mt-3 text-subhead ${subCls} max-w-xl ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {subhead}
        </p>
      ) : null}
    </div>
  );
}
