/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";

const colors = {
  primary: "#00ffb3",
  bgDark: "#0d0f11",
  surfaceDark: "#15181c",
};

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],

safelist: [
  'bg-gradient-radial',
  'from-primary/30',
  'from-primary/20',
  'via-primary/10',
  'to-transparent',
  'blur-[180px]',
  'blur-[200px]',
  'opacity-70',
  'opacity-80',
  'w-[1000px]',
  'w-[1400px]',
  'h-[1000px]',
  'h-[1400px]'
],

  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },

      colors,
      fontFamily: {
        sans: ["Inter", "ui-sans-serif"],
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            table: { width: "100%", borderCollapse: "collapse" },
            thead: { backgroundColor: "#1e1e1e" },
            th: {
              border: "1px solid #666",
              color: "#fff",
              padding: "0.5rem",
              textAlign: "left",
            },
            td: {
              border: "1px solid #444",
              padding: "0.5rem",
              color: "#ddd",
            },
          },
        },
      },
    },
  },
  plugins: [typography],
};
