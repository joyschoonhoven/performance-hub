import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Hub — refined dark theme
        hub: {
          bg: "#13151e",
          surface: "#191c28",
          card: "#1e2236",
          border: "#272d42",
          "border-light": "#333d58",
          teal: "#6475f5",
          "teal-dim": "#4f5de8",
          indigo: "#a78bfa",
          gold: "#e8a020",
          "gold-dim": "#c8891a",
          red: "#f87171",
          green: "#34d399",
          orange: "#fb923c",
        },
        // Sidebar
        sidebar: {
          bg: "#0f1119",
          surface: "#141720",
          card: "#1e2236",
          border: "#272d42",
          text: "#e2e8f0",
          muted: "#7f8eaa",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(0,184,145,0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(0,184,145,0.6)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        glow: "glow 2s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "hub-gradient": "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        "card-gradient": "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        "teal-gradient": "linear-gradient(135deg, #00b891 0%, #6366f1 100%)",
        "gold-gradient": "linear-gradient(135deg, #d97706 0%, #ef4444 100%)",
        "sidebar-gradient": "linear-gradient(180deg, #0f1629 0%, #162040 100%)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.3), 0 1px 2px -1px rgba(0,0,0,0.2)",
        "card-md": "0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)",
        "card-lg": "0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -4px rgba(0,0,0,0.3)",
        "teal-glow": "0 0 20px rgba(0,184,145,0.25)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
