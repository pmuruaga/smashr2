/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Solanel", "Georgia", "serif"],
        sans: ['"Segoe UI"', "system-ui", "sans-serif"],
        solanel: ["Solanel", "sans-serif"],
      },
      colors: {
        court: {
          bg: "#eef3ea",
          surface: "#ffffff",
          elevated: "#dde6d8",
          line: "#9aaf90",
          muted: "#3d4f40",
          text: "#1a241c",
        },
        smashr: {
          gold: "#8a841f",
          green: "#2f6b08",
          dark: "#1a241c",
        },
      },
      boxShadow: {
        glow: "0 8px 24px rgba(26, 36, 28, 0.12)",
      },
      backgroundImage: {
        "court-night":
          "linear-gradient(180deg, #f4f7f1 0%, #e8efe3 55%, #e2eadc 100%)",
      },
    },
  },
  plugins: [],
};
