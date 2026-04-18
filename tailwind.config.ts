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
        // Hub — light theme
        hub: {
          bg: "#F4F5F7",
          surface: "#FFFFFF",
          card: "#FFFFFF",
          border: "#E4E7EB",
          "border-light": "#D1D5DB",
          teal: "#4FA9E6",        // Premium Light Blue — accent/actions
          "teal-dim": "#2B8AC7",  // Deeper blue for hover
          indigo: "#0A2540",      // Deep Navy — authority/structure
          gold: "#d97706",
          "gold-dim": "#b45309",
          red: "#ef4444",
          green: "#22c55e",
          orange: "#f97316",
        },
        // Sidebar — Deep Navy
        sidebar: {
          bg: "#0A2540",
          surface: "#0D2D4D",
          card: "#0F3460",
          border: "#1A3A5C",
          text: "#F4F5F7",
          muted: "#7BA7C4",
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
          "0%, 100%": { boxShadow: "0 0 10px rgba(79,169,230,0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(79,169,230,0.6)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        glow: "glow 2s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "hub-gradient": "linear-gradient(135deg, #F4F5F7 0%, #FFFFFF 100%)",
        "card-gradient": "linear-gradient(135deg, #ffffff 0%, #F4F5F7 100%)",
        "teal-gradient": "linear-gradient(135deg, #4FA9E6 0%, #0A2540 100%)",
        "gold-gradient": "linear-gradient(135deg, #d97706 0%, #ef4444 100%)",
        "sidebar-gradient": "linear-gradient(180deg, #0A2540 0%, #0D2D4D 100%)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(10,37,64,0.06), 0 1px 2px -1px rgba(10,37,64,0.04)",
        "card-md": "0 4px 6px -1px rgba(10,37,64,0.08), 0 2px 4px -2px rgba(10,37,64,0.06)",
        "card-lg": "0 10px 15px -3px rgba(10,37,64,0.1), 0 4px 6px -4px rgba(10,37,64,0.06)",
        "teal-glow": "0 0 20px rgba(79,169,230,0.25)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
