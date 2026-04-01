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
          50: '#e6f5f1',
          100: '#c2e8dd',
          200: '#9adbc8',
          300: '#6ecdb3',
          400: '#47c09f',
          500: '#1E9A80',
          600: '#1a8872',
          700: '#157562',
          800: '#106152',
          900: '#0a4e42',
        },
        chat: {
          bg: '#F3F3EE',
          sidebar: '#ffffff',
          hover: '#F3F3EE',
          sent: '#F0FDF4',
          received: '#ffffff',
          input: '#F3F3EE',
          border: '#E8E5DF',
        },
        heading: '#111625',
        body: '#1C1C1C',
        muted: '#8B8B8B',
        placeholder: '#8796AF',
        online: '#38C793',
        destructive: '#DF1C41',
      },
    },
  },
  plugins: [],
}
