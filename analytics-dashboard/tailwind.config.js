/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        linen: '#FBF3EB',
        white_card: '#FEFBF9',
        bronze: '#DA9958',
        mocha: '#3C2E26',
        ash: '#58463A',
        taupe: '#8B7364',
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
