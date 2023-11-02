const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: colors.teal,
        gray: colors.zinc,
        info: colors.sky,
        danger: colors.red,
      },
    },
  },
  plugins: [],
}

