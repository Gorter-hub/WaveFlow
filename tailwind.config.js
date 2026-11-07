/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        spotify: {
          DEFAULT: '#1DB954',
          hover: '#1ed760',
          dark: '#15883e',
          black: '#121212',
          card: '#181818',
          'card-hover': '#282828',
          subtext: '#b3b3b3'
        }
      },
      fontFamily: {
        sans: [
          'Circular Std',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif'
        ]
      },
      keyframes: {
        pulseSlow: {
          '0%, 100%': { opacity: 0.3, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)' },
        },
        wave: {
          '0%': { height: '20%' },
          '50%': { height: '100%' },
          '100%': { height: '20%' }
        }
      },
      animation: {
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        'wave-bar': 'wave 1.2s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}
