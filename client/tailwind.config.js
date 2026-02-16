/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fefcf7',
          100: '#fdf6e8',
          200: '#f9e8c5',
          300: '#f3d49a',
          400: '#ecb85e',
          500: '#e5a03b',
          600: '#d08528',
          700: '#ad6620',
          800: '#8c5121',
          900: '#73441e',
        },
        wood: {
          50: '#faf6f1',
          100: '#f0e6d7',
          200: '#dfcaad',
          300: '#cba77c',
          400: '#bb8a58',
          500: '#ae7546',
          600: '#955d3a',
          700: '#784832',
          800: '#643c2e',
          900: '#553328',
          950: '#301a14',
        },
        ranch: {
          50: '#f4f7f4',
          100: '#e0e8e0',
          200: '#c2d1c2',
          300: '#9ab39b',
          400: '#6f8e70',
          500: '#547356',
          600: '#415c43',
          700: '#354a37',
          800: '#2c3c2e',
          900: '#253226',
          950: '#131c14',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
