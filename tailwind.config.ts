import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dd: {
          primary: "#E05A47",
          "primary-shadow": "#B8382A",
          accent: "#FFCB47",
          "accent-shadow": "#D4A32E",
          secondary: "#4A90C4",
          "secondary-shadow": "#346A93",
          success: "#5AAD72",
          surface: "#FFFAF0",
          card: "#FFFFFF",
          border: "#2A2A2A",
          "muted-border": "#E0D6C8",
          text: "#2A2A2A",
          "text-muted": "#888888",
        },
      },
      fontFamily: {
        display: ["Nunito", "system-ui", "sans-serif"],
        body: ["Nunito Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "dd-pill": "999px",
        "dd-card": "24px",
        "dd-photo": "16px",
      },
      boxShadow: {
        "dd-card": "6px 6px 0 #2A2A2A",
        "dd-card-hover": "8px 8px 0 #2A2A2A",
        "dd-btn-primary": "0 4px 0 #B8382A",
        "dd-btn-primary-pressed": "0 2px 0 #B8382A",
        "dd-btn-secondary": "0 4px 0 #346A93",
        "dd-btn-secondary-pressed": "0 2px 0 #346A93",
        "dd-btn-accent": "0 4px 0 #D4A32E",
        "dd-btn-accent-pressed": "0 2px 0 #D4A32E",
      },
    },
  },
  plugins: [],
} satisfies Config;
