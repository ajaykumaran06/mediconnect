/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e6f7f5',
          100: '#b3e8e2',
          200: '#80d8cf',
          300: '#4dc9bc',
          400: '#26bdb0',
          500: '#0b8a7a', // brand teal
          600: '#097a6b',
          700: '#076659',
          800: '#055247',
          900: '#033d35',
        },
        accent: {
          400: '#f59e0b',
          500: '#d97706',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
