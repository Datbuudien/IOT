/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7f1',
          100: '#b3e8d6',
          200: '#80d8bb',
          300: '#4dc9a0',
          400: '#1ab985',
          500: '#00a66a',
          600: '#008555',
          700: '#006440',
          800: '#00432a',
          900: '#002215',
        },
        secondary: {
          50: '#e6f4ff',
          100: '#b3ddff',
          200: '#80c7ff',
          300: '#4db0ff',
          400: '#1a9aff',
          500: '#0080ff',
          600: '#0066cc',
          700: '#004d99',
          800: '#003366',
          900: '#001a33',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00a66a 0%, #00d084 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #0080ff 0%, #00a3ff 100%)',
      }
    },
  },
  plugins: [],
}
