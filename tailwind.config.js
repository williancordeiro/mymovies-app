/** @type {import('tailwindcss').Config} */
const { APP_COLORS } = require("./src/constants/colors");

module.exports = {
  content: ["app/**/*.{js,ts,jsx,tsx}", "src/components/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: APP_COLORS.primary,
        appBackground: APP_COLORS.background,
        appSurface: APP_COLORS.surface,
      },
    },
  },
  plugins: [],
};
