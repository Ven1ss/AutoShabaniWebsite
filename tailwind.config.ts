import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Workshop bench / parts-bin system — not cream, not neon-dark.
        surface: {
          DEFAULT: "#EEF1F4",
          alt: "#E3E7EC",
          white: "#FFFFFF",
          ticket: "#F7F8FA",
        },
        ink: {
          DEFAULT: "#161A20",
          muted: "#5A6370",
          faint: "#8B949E",
        },
        steel: {
          DEFAULT: "#3F4854",
          light: "#C2C9D2",
          mid: "#7A8491",
        },
        // Brand red — brake-light / packaging signal already on the logo.
        signal: {
          DEFAULT: "#C8102E",
          deep: "#9E0C24",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        brand: ["Ethnocentric Rg", "var(--font-display)", "sans-serif"],
      },
      letterSpacing: {
        brand: "0.22em",
      },
      backgroundImage: {
        "surface-noise":
          "radial-gradient(ellipse 70% 45% at 0% 0%, rgba(200,16,46,0.04), transparent 55%), radial-gradient(ellipse 55% 40% at 100% 10%, rgba(63,72,84,0.07), transparent 50%)",
        "ticket-perforation":
          "radial-gradient(circle, #EEF1F4 2.5px, transparent 2.6px)",
      },
      backgroundSize: {
        perforation: "12px 12px",
      },
    },
  },
  plugins: [],
};

export default config;
