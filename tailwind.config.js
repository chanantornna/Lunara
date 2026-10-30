/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lunara: {
          pink: '#f5a9c7',
          'pink-soft': '#fbe0ec',
          lilac: '#c9b6f0',
          'lilac-soft': '#ece4fb',
          cream: '#fdf7fb',
          rose: '#e8799f',
          plum: '#6b4e82',
        },
        tip: {
          info: '#5aa9e6',
          warn: '#e0a23b',
          doctor: '#e07a7a',
        },
      },
      fontFamily: {
        sans: ['Noto Sans Thai', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
