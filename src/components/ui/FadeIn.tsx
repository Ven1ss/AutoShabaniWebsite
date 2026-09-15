"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Distance in px for the rise */
  y?: number;
};

/**
 * Scroll reveal without hydration mismatch.
 * Server + first client paint: plain div, no inline motion styles.
 * After mount: fade/rise when entering the viewport (skipped if reduced motion).
 */
export default function FadeIn({
  children,
  className = "",
  delay = 0,
  y = 16,
}: Props) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15, margin: "-10% 0px" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const animate = mounted && reduceMotion !== true;
  const shown = !animate || inView;

  return (
    <div
      ref={ref}
      className={className}
      style={
        animate
          ? {
              opacity: shown ? 1 : 0,
              transform: shown ? "translateY(0px)" : `translateY(${y}px)`,
              transitionProperty: "opacity, transform",
              transitionDuration: "0.36s",
              transitionTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1)",
              transitionDelay: `${delay}s`,
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
