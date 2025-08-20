import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        // CalAI US market-optimized colors
        calai: {
          primary: "#06B6D4",      // Modern cyan - trusted, clean
          primaryDark: "#0891B2",  // Darker cyan for hover states
          secondary: "#22C55E",    // Success green - health/nutrition
          accent: "#F97316",       // Energy orange - action/motivation
          warn: "#F59E0B",         // Amber - warnings
          error: "#EF4444",        // Red - errors
          info: "#3B82F6",         // Blue - information
          bg: "#F8FAFC",          // Light background
          ink: "#0F172A"          // Dark text
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Geist Mono', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "scan": {
          "0%": {
            transform: "translateY(-100%)",
            opacity: "0.6",
          },
          "50%": {
            opacity: "1",
          },
          "100%": {
            transform: "translateY(100%)",
            opacity: "0.6",
          },
        },
        "shimmer": {
          "0%": {
            backgroundPosition: "-200px 0",
          },
          "100%": {
            backgroundPosition: "calc(200px + 100%) 0",
          },
        },
        "pulse-ring": {
          "0%": {
            transform: "scale(0.33)",
          },
          "80%, 100%": {
            opacity: "0",
          },
        },
        "pulse-dot": {
          "0%": {
            transform: "scale(0.8)",
          },
          "50%": {
            transform: "scale(1.0)",
          },
          "100%": {
            transform: "scale(0.8)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "scan": "scan 2s linear infinite",
        "shimmer": "shimmer 1.5s infinite",
        "pulse-ring": "pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "pulse-dot": "pulse-dot 1.25s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite",
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'calai-gradient': 'linear-gradient(45deg, #06B6D4, #22C55E)',
        'calai-gradient-hover': 'linear-gradient(45deg, #0891B2, #16A34A)',
        "calai-hero": "linear-gradient(135deg, #06B6D4 0%, #22C55E 100%)"
      },
      boxShadow: {
        'calai': '0 4px 6px -1px rgba(6, 182, 212, 0.1), 0 2px 4px -1px rgba(6, 182, 212, 0.06)',
        'calai-lg': '0 10px 15px -3px rgba(6, 182, 212, 0.1), 0 4px 6px -2px rgba(6, 182, 212, 0.05)',
        soft: "0 8px 24px rgba(2, 6, 23, 0.08)"
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography")
  ],
} satisfies Config;
