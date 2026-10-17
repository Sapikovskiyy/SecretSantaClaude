module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cocoa: { DEFAULT: '#281D19', 800: '#352823', 700: '#43342D' },
        cherry: { DEFAULT: '#D5361C', deep: '#8E1F10', glow: '#FF6A4D' },
        pine: { DEFAULT: '#006B43', deep: '#044D32', light: '#1F9A63' },
        cream: { DEFAULT: '#FFE4CE', 50: '#FFF9F2', 300: '#F2C9A8' },
        taupe: '#82736B', gold: '#E6B96C',
      },
      fontFamily: {
        display: ['Unbounded', 'Manrope', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '28px', sheet: '36px' },
      boxShadow: { soft: '0 18px 40px -18px rgba(0,0,0,.55)' },
      keyframes: { float: { '0%,100%': { transform: 'translateY(0) rotate(-2deg)' }, '50%': { transform: 'translateY(-12px) rotate(2deg)' } } },
      animation: { float: 'float 5s ease-in-out infinite' },
    },
  },
};
