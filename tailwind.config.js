/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        golden: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
      },
      backgroundImage: {
        gold: 'linear-gradient(to right, #f59e0b, #fbbf24, #f59e0b)',
      },
      fontFamily: {
        bungee: ['Bungee', 'sans-serif'],
        rye: ['Rye'],
        rubikDoodle: ['"Rubik Doodle Shadow"', 'system-ui'],
        permanentMarker: ['"Permanent Marker"', 'cursive'],
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
