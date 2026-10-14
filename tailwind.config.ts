import type { Config } from "tailwindcss";

/**
 * AUTO SHABANI — Apple-inspired design tokens
 * Accent: brand signal red #C8102E (kept from logo)
 * Base: near-monochrome whites / near-blacks / grays
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple-like neutrals
        as: {
          white: "#FFFFFF",
          snow: "#F5F5F7",
          mist: "#E8E8ED",
          gray: "#86868B",
          secondary: "#6E6E73",
          dark: "#1D1D1F",
          black: "#000000",
        },
        // Single accent — brand red
        accent: {
          DEFAULT: "#C8102E",
          deep: "#9E0C24",
          soft: "rgba(200, 16, 46, 0.1)",
        },
        // Legacy aliases (keep existing pages compiling during Phase 2+)
        surface: {
          DEFAULT: "#F5F5F7",
          alt: "#E8E8ED",
          white: "#FFFFFF",
          ticket: "#F5F5F7",
        },
        ink: {
          DEFAULT: "#1D1D1F",
          muted: "#6E6E73",
          faint: "#86868B",
        },
        steel: {
          DEFAULT: "#6E6E73",
          light: "#D2D2D7",
          mid: "#86868B",
        },
        signal: {
          DEFAULT: "#C8102E",
          deep: "#9E0C24",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        brand: ["Ethnocentric Rg", "var(--font-manrope)", "sans-serif"],
      },
      fontSize: {
        // Fluid type scale — readable, restrained
        caption: [
          "var(--text-caption)",
          { lineHeight: "1.4", letterSpacing: "0", fontWeight: "500" },
        ],
        body: [
          "var(--text-body)",
          { lineHeight: "1.6", letterSpacing: "-0.01em", fontWeight: "400" },
        ],
        price: [
          "var(--text-price)",
          { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        button: [
          "var(--text-body)",
          { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "500" },
        ],
        subhead: [
          "clamp(1.0625rem, 0.98rem + 0.35vw, 1.1875rem)",
          { lineHeight: "1.55", letterSpacing: "-0.01em", fontWeight: "400" },
        ],
        section: [
          "clamp(1.5rem, 1.2rem + 1.4vw, 2.25rem)",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        hero: [
          "clamp(1.75rem, 1.35rem + 2vw, 2.75rem)",
          { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "700" },
        ],
      },
      maxWidth: {
        content: "980px",
        wide: "1480px",
        shelf: "1280px",
      },
      spacing: {
        section: "7.5rem",
        "section-lg": "10rem",
        "section-xl": "11.25rem",
        "page-x": "var(--page-pad-x)",
        "gap-fluid": "var(--gap-md)",
      },
      borderRadius: {
        control: "980px",
        card: "var(--radius-card)",
        media: "var(--radius-media)",
      },
      transitionDuration: {
        motion: "280ms",
        "motion-fast": "200ms",
        "motion-slow": "400ms",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.06)",
        "card-hover": "0 12px 40px rgba(0,0,0,0.12)",
        nav: "0 1px 0 rgba(0,0,0,0.06)",
      },
      letterSpacing: {
        brand: "0.18em",
      },
      keyframes: {
        "fade-rise": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-rise": "fade-rise 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
