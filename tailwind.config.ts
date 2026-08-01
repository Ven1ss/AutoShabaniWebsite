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
        surface: {
          DEFAULT: "#F4F6F8",
          alt: "#E8ECF0",
          white: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#12151A",
          muted: "#5C6570",
          faint: "#8A939E",
        },
        steel: {
          DEFAULT: "#3D4654",
          light: "#C5CCD6",
        },
        signal: {
          DEFAULT: "#C8102E",
          deep: "#9E0C24",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        brand: ["Ethnocentric Rg", "var(--font-display)", "sans-serif"],
      },
      letterSpacing: {
        brand: "0.22em",
      },
      backgroundImage: {
        "surface-noise":
          "radial-gradient(ellipse 80% 50% at 10% 0%, rgba(200,16,46,0.05), transparent 50%), radial-gradient(ellipse 60% 40% at 100% 20%, rgba(61,70,84,0.06), transparent 45%)",
      },
    },
  },
  plugins: [],
};

export default config;
