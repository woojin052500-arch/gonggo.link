/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'apple-blue': '#0071E3',
        'apple-blue-dark': '#0058B0',
        'apple-blue-light': '#E8F2FF',
        'apple-dark': '#1D1D1F',
        'apple-secondary': '#6E6E73',
        'apple-bg': '#F5F5F7',
      },
      boxShadow: {
        'apple-sm': '0 2px 8px rgba(0,0,0,0.06)',
        'apple-md': '0 4px 20px rgba(0,0,0,0.08)',
        'blue-glow': '0 4px 20px rgba(0,113,227,0.20)',
      },
    },
  },
  plugins: [],
};