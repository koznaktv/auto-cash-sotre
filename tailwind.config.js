/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        alkatip: [
          "'ALKATIP Basma Tom'",
          "'ALKATIP Basma'",
          "'UKIJ Esline'",
          "'UKIJ Tuz'",
          "'Microsoft Uighur'",
          "'Noto Sans Arabic'",
          "system-ui",
          "sans-serif",
        ],
        ukij: [
          "'UKIJ Esline'",
          "'UKIJEsline'",
          "'ALKATIP Basma Tom'",
          "'Microsoft Uighur'",
          "'Noto Sans Arabic'",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "'ALKATIP Basma Tom'",
          "'ALKATIP Basma'",
          "'UKIJ Esline'",
          "'UKIJ Tuz'",
          "'Microsoft Uighur'",
          "'Noto Sans Arabic'",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
