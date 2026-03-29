/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e8f5f1',
          100: '#d1ebe3',
          200: '#a3d7c7',
          300: '#75c3ab',
          400: '#47af8f',
          500: '#00A884',
          600: '#008a6d',
          700: '#006b54',
          800: '#004d3c',
          900: '#002e24',
        },
        chat: {
          bg: '#f0f2f5',
          sidebar: '#ffffff',
          hover: '#f5f6f6',
          sent: '#d9fdd3',
          received: '#ffffff',
          input: '#f0f2f5',
          border: '#e9edef',
        },
      },
    },
  },
  plugins: [],
}
