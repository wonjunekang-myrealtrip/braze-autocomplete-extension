/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      zIndex: {
        '9999': '9999',
        '10000': '10000'
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem'
      }
    },
  },
  plugins: [],
  important: true, // Chrome Extension에서 스타일 우선순위 보장
}
