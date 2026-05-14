import type { Config } from "tailwindcss";

const helvetica = [
  '"Inter"',
  "-apple-system",
  "BlinkMacSystemFont",
  '"SF Pro Text"',
  '"Segoe UI"',
  "system-ui",
  "sans-serif",
];

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
        card:       { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover:    { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary:    { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary:  { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted:      { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent:     { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive:{ DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",

        // ── SFA Brand palette ─────────────────────────────────
        sfa: {
          navy:      "#0D1B2A",
          "navy-mid":"#1A2E45",
          blue:      "#1B6CA8",
          sky:       "#4DAEE5",
          "sky-light":"#E6F4FC",
          white:     "#FFFFFF",
          "off-white":"#F4F7FA",
          gray:      "#8A9BB0",
          gold:      "#F0A500",
          red:       "#D64045",
        },

        // ── Compat aliases (back-compat for existing classes) ──
        navy: { DEFAULT: "#0D1B2A", mid: "#1A2E45", light: "#1B6CA8", faint: "#E6F4FC" },
        gold: { DEFAULT: "#F0A500", light: "#FFC04C", dim: "#B07700", faint: "#FFF6E0" },

        // ── Hub aliases (back-compat → SFA palette) ──────────
        hub: {
          bg:            "#F4F7FA",
          surface:       "#FFFFFF",
          card:          "#FFFFFF",
          border:        "#E6F4FC",
          "border-light":"#8A9BB0",
          teal:          "#1B6CA8",
          "teal-dim":    "#0D1B2A",
          indigo:        "#0D1B2A",
          gold:          "#F0A500",
          "gold-dim":    "#B07700",
          red:           "#D64045",
          orange:        "#D97706",
          purple:        "#7C3AED",
          success:       "#16A34A",
        },

        // ── Pro aliases ──────────────────────────────────────
        pro: {
          primary:    "#001B48",
          accent:     "#002B6E",
          gold:       "#C4A84F",
          "gold-dim": "#8C7535",
          surface:    "#F4F5F7",
          "surface-2":"#FFFFFF",
          "surface-3":"#EFF1F4",
          success:    "#16A34A",
          danger:     "#DC2626",
          muted:      "#6B7280",
        },

        sidebar: {
          bg:      "#001B48",
          surface: "#002254",
          card:    "#002B6E",
          border:  "rgba(255,255,255,0.07)",
          text:    "#FFFFFF",
          muted:   "#8BA4C8",
        },
      },

      borderRadius: {
        lg:  "14px",
        md:  "10px",
        sm:  "7px",
        xl:  "18px",
        "2xl": "24px",
        "3xl": "32px",
      },

      fontFamily: {
        sans:    helvetica,
        display: helvetica,
        helvetica,
        // compat aliases — all point to helvetica now
        oswald:  helvetica,
        bebas:   helvetica,
        inter:   helvetica,
        mono:    ['"JetBrains Mono"', '"IBM Plex Mono"', '"Fira Code"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },

      fontSize: {
        "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.06em" }],
      },

      backgroundImage: {
        "hub-gradient":     "linear-gradient(135deg, #F4F5F7 0%, #FFFFFF 100%)",
        "card-gradient":    "linear-gradient(135deg, #FFFFFF 0%, #EFF1F4 100%)",
        "navy-gradient":    "linear-gradient(135deg, #001B48 0%, #002B6E 100%)",
        "gold-gradient":    "linear-gradient(135deg, #C4A84F 0%, #D4BC72 100%)",
        "hero-gradient":    "linear-gradient(180deg, transparent 0%, rgba(0,27,72,0.88) 100%)",
        "sidebar-gradient": "linear-gradient(180deg, #001B48 0%, #001234 100%)",
      },

      boxShadow: {
        card:    "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        "card-md":"0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
        "card-lg":"0 4px 16px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.06)",
        navy:    "0 4px 16px rgba(0,27,72,0.2)",
        gold:    "0 4px 16px rgba(196,168,79,0.25)",
        inset:   "inset 0 1px 2px rgba(0,0,0,0.04)",
      },

      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        shimmer:  { "100%": { transform: "translateX(100%)" } },
        float:    { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-5px)" } },
        fadeInUp: { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shake:    { "0%,100%": { transform: "translateX(0)" }, "25%": { transform: "translateX(-6px)" }, "75%": { transform: "translateX(6px)" } },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        shimmer:          "shimmer 2s infinite",
        float:            "float 3s ease-in-out infinite",
        "fade-in-up":     "fadeInUp 0.3s ease-out",
        shake:            "shake 0.4s ease",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
