import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "rgb(var(--color-base) / <alpha-value>)",
        sand: {
          100: "rgb(var(--sand-100) / <alpha-value>)",
          300: "rgb(var(--sand-300) / <alpha-value>)"
        },
        mint: {
          200: "rgb(var(--mint-200) / <alpha-value>)",
          400: "rgb(var(--mint-400) / <alpha-value>)"
        },
        aqua: {
          300: "rgb(var(--aqua-300) / <alpha-value>)",
          400: "rgb(var(--aqua-400) / <alpha-value>)"
        },
        turquoise: {
          500: "rgb(var(--turquoise-500) / <alpha-value>)"
        },
        ocean: {
          600: "rgb(var(--ocean-600) / <alpha-value>)",
          700: "rgb(var(--ocean-700) / <alpha-value>)",
          800: "rgb(var(--ocean-800) / <alpha-value>)",
          900: "rgb(var(--ocean-900) / <alpha-value>)"
        },
        ink: {
          400: "rgb(var(--ink-400) / <alpha-value>)",
          600: "rgb(var(--ink-600) / <alpha-value>)",
          900: "rgb(var(--ink-900) / <alpha-value>)"
        },
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          placeholder: "rgb(var(--text-placeholder) / <alpha-value>)"
        },
        danger: {
          100: "rgb(var(--danger-100) / <alpha-value>)",
          600: "rgb(var(--danger-600) / <alpha-value>)"
        }
      },
      fontFamily: {
        heading: ["var(--font-outfit)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"]
      },
      borderRadius: {
        soft: "12px",
        calm: "18px",
        cloud: "28px"
      },
      boxShadow: {
        neuro: "var(--nm-raised)",
        "neuro-sm": "var(--nm-raised-sm)",
        "neuro-lg": "var(--nm-raised-lg)",
        "neuro-inset": "var(--nm-pressed)",
        focus: "var(--nm-focus)"
      },
      transitionTimingFunction: {
        calm: "ease-out"
      }
    }
  },
  plugins: []
};

export default config;
