/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#263E8B",
          light: "#3a57b8",
          dark: "#1a2d6b",
          50:  "#eef1fb",
          100: "#d5dcf4",
        },
        secondary: {
          DEFAULT: "#E3A437",
          light: "#f0ba5a",
          dark: "#c48a20",
          50:  "#fdf6e8",
        },
        accent: {
          DEFAULT: "#2CA36B",
          light: "#3dc47f",
          dark: "#1e7a50",
          50:  "#eaf7f0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
