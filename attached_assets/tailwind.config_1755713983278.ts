import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        calai: {
          primary: "#06B6D4",
          primaryDark: "#0891B2",
          secondary: "#22C55E",
          accent: "#F97316",
          warn: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
          bg: "#F8FAFC",
          ink: "#0F172A"
        }
      },
      backgroundImage: {
        "calai-hero": "linear-gradient(135deg,#06B6D4 0%,#22C55E 100%)"
      },
      boxShadow: {
        soft: "0 8px 24px rgba(2, 6, 23, 0.08)"
      },
      borderRadius: {
        xl: "0.9rem",
        '2xl': "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
