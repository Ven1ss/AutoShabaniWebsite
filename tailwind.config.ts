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
        black: {
          deep: "#0b0b0b",
          softer: "#111111",
          card: "#141414",
        },
        accent: {
          red: "#c41e3a",
          "red-glow": "rgba(196, 30, 58, 0.4)",
          gold: "#c9a962",
          "gold-muted": "#a68b4b",
        },
      },
      fontFamily: {
        sans: ["var(--font-satoshi)", "system-ui", "sans-serif"],
        display: ["var(--font-satoshi)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(196, 30, 58, 0.08), transparent), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(201, 169, 98, 0.04), transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
