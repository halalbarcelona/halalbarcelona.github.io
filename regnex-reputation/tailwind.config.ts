import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        ink: "#151A21",
        "ink-soft": "#5B6472",
        "ink-faint": "#8A93A0",
        line: "#E4E7EC",
        "line-soft": "#EDEFF2",
        bg: "#F4F5F7",
        surface: "#FFFFFF",
        "surface-muted": "#F0F1F4",
        brand: {
          50: "#EEF0F5",
          100: "#D6DAE6",
          200: "#AEB6CC",
          300: "#8089AC",
          400: "#57608A",
          500: "#3A4166",
          600: "#262C4C",
          700: "#1B2038",
          800: "#151928",
          900: "#0E111C",
        },
        accent: {
          50: "#FDF3E7",
          100: "#FAE3C2",
          200: "#F3C685",
          300: "#E7A94E",
          400: "#D4922E",
          500: "#B87A1F",
          600: "#976318",
          700: "#764C13",
        },
        success: { DEFAULT: "#1E7A3D", bg: "#E7F6EC", ring: "#16A34A" },
        warning: { DEFAULT: "#9A5B0A", bg: "#FEF3E2", ring: "#D97706" },
        danger: { DEFAULT: "#B3271C", bg: "#FDE7E4", ring: "#DC2626" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(21,26,33,0.04), 0 1px 1px rgba(21,26,33,0.03)",
        "card-hover": "0 4px 12px rgba(21,26,33,0.08), 0 2px 4px rgba(21,26,33,0.05)",
        popover: "0 12px 32px rgba(14,17,28,0.16), 0 2px 8px rgba(14,17,28,0.08)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease both",
        "toast-in": "toast-in 0.22s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
