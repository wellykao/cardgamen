import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        table: {
          dark: '#1B5E20',
          DEFAULT: '#2E7D32',
          light: '#4CAF50',
          border: '#5D4037',
          gold: '#D4AF37',
        },
        card: {
          red: '#C41E3A',
          black: '#1A1A2E',
          bg: '#FFFEF0',
        },
        accent: {
          gold: '#FFD700',
          crimson: '#8B0000',
          emerald: '#4CAF50',
          amber: '#FFC107',
          danger: '#FF5252',
        },
      },
      fontFamily: {
        game: ['PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      animation: {
        'float-up': 'floatUp 1.5s ease-out forwards',
        'glow-pulse': 'glowPulse 1.5s ease-in-out infinite',
        'card-flip': 'cardFlip 0.6s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-60px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px #FFD700, 0 0 10px #FFD700' },
          '50%': { boxShadow: '0 0 20px #FFD700, 0 0 30px #FFD700' },
        },
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    animate,
  ],
}
