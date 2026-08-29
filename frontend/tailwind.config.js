/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4f7fb',
          100: '#e6edf7',
          200: '#c9d7eb',
          700: '#243b5a',
          800: '#1a2b43',
          900: '#111c2d',
        },
        accent: {
          DEFAULT: '#0d9488',
          dark: '#0f766e',
          soft: '#ccfbf1',
        },
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 18px 50px rgba(17, 28, 45, 0.08)',
      },
    },
  },
  plugins: [],
};
