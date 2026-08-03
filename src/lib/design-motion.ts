/**
 * Design system motion principles (Phase 1)
 *
 * - Scroll reveal: FadeIn — opacity 0→1 + translateY 16→0, ~360ms, ease apple, once
 * - Buttons: color transition 200ms + active scale 0.98
 * - ProductCard: hover lift + image scale 1.04 over 400ms (desktop only)
 * - Nav: background / blur transition ~280ms on scroll
 * - prefers-reduced-motion: all animated components short-circuit to static
 */
export const MOTION = {
  durationMs: { fast: 200, default: 280, slow: 400 },
  ease: [0.25, 0.1, 0.25, 1] as const,
  risePx: 16,
} as const;
