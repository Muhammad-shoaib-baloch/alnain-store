/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FBF6E9',
          100: '#F8EFD6',
          200: '#F2D07E',
          300: '#E9C167',
          400: '#D2A94C',
          500: '#B99338',
          600: '#9A782B',
          700: '#775C20',
          800: '#544016',
          900: '#32260C',
          DEFAULT: '#B99338',
        },
        ink: '#111009',
        charcoal: {
          DEFAULT: '#211E17',
          light: '#37332A',
        },
        ivory: '#FBF9F4',
        cream: '#F5F0E6',
        beige: '#EAE0CC',
        clay: '#8A7A5C',
        smoke: '#6B6557',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        arabic: ['"Aref Ruqaa"', 'serif'],
      },
      maxWidth: {
        page: '1440px',
      },
      boxShadow: {
        soft: '0 6px 30px -12px rgba(17, 16, 9, 0.18)',
        lift: '0 18px 50px -20px rgba(17, 16, 9, 0.35)',
        card: '0 1px 2px rgba(17,16,9,0.05), 0 8px 24px -18px rgba(17,16,9,0.25)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        kenburns: {
          from: { transform: 'scale(1)' },
          to: { transform: 'scale(1.08)' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateY(-8px) scale(.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn .35s ease both',
        fadeUp: 'fadeUp .5s ease both',
        slideInRight: 'slideInRight .3s cubic-bezier(.32,.72,.32,1) both',
        slideInLeft: 'slideInLeft .3s cubic-bezier(.32,.72,.32,1) both',
        slideUp: 'slideUp .3s cubic-bezier(.32,.72,.32,1) both',
        kenburns: 'kenburns 9s ease-out both',
        toastIn: 'toastIn .25s ease both',
      },
    },
  },
  plugins: [],
}
