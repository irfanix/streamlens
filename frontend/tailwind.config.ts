import type { Config } from "tailwindcss";

// Light and clean theme, teal / green main color.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F8FAFC",
        "bg-elevated": "#FFFFFF",
        surface: "#FFFFFF",
        line: "#E2E8F0",
        "line-strong": "#CBD5E1",
        primary: "#0F766E",
        "primary-hover": "#115E59",
        "primary-soft": "#F0FDFA",
        accent: "#0F766E",
        text: "#0F172A",
        "text-muted": "#475569",
        "risk-low": "#15803D",
        "risk-moderate": "#B45309",
        "risk-high": "#B91C1C"
      },
      fontFamily: {
        heading: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      },
      boxShadow: {
        glass: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        teal: "0 0 0 1px #0F766E, 0 4px 16px rgba(15,118,110,0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;
