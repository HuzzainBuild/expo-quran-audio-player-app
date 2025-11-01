/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/index.tsx", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eefff5",
          100: "#d8ffea",
          200: "#b4fed6",
          300: "#79fcb7",
          400: "#38f08f",
          500: "#0ed970",
          600: "#05b459",
          700: "#088c48",
          800: "#0c6f3d",
          900: "#0c5b34",
          950: "#00331b",
        },
        secondary: "#82B098",
      },
      fontFamily: {
        nunitosans: ["NunitoSans-Regular", "sans-serif"],
        "nunitosans-bold": ["NunitoSans-Bold", "sans-serif"],
        "nunitosans-semibold": ["NunitoSans-SemiBold", "sans-serif"],
        amiriquran: ["AmiriQuran-Regular", "sans-serif"],
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
