/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light-mode surfaces & borders (slate-tinted)
        parchment: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Dark-mode surfaces & text neutrals (deep navy)
        wood: {
          50: '#eef3fa',
          100: '#d4dfef',
          200: '#afc2de',
          300: '#839ec5',
          400: '#6080ab',
          500: '#4a6590',
          600: '#3a5075',
          700: '#2e405e',
          800: '#1c2b42',
          900: '#131e32',
          950: '#0b1424',
        },
        // Primary brand (based on #0885ff)
        brand: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bbd5ff',
          300: '#8cb9ff',
          400: '#5594ff',
          500: '#0885ff',
          600: '#0069e0',
          700: '#0053b6',
          800: '#004696',
          900: '#003c7c',
          950: '#00254d',
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
