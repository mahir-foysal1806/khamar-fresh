/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        leaf: { 50: '#f1f8ee', 100: '#dff0d8', 200: '#bfe0b3', 300: '#94c882', 400: '#68ab51', 500: '#4a9035', 600: '#397228', 700: '#2e5a22', 800: '#274a1f', 900: '#1d3818' },
        honey: { 50: '#fff9eb', 100: '#ffefc6', 200: '#ffdd88', 300: '#ffc84a', 400: '#fbb220', 500: '#f59308', 600: '#d97004', 700: '#b45007' },
        earth: { 50: '#faf6f1', 100: '#f1e8dc', 200: '#e2d0b8', 300: '#cfb08c', 400: '#bb8f64', 500: '#a8764a', 600: '#8f5f3d', 700: '#744b34', 800: '#5f3f2e', 900: '#4f3528' },
        cream: '#fdfaf3',
      },
      fontFamily: {
        sans: ['"Hind Siliguri"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', '"Hind Siliguri"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 2px 16px -4px rgba(46,90,34,.15)',
        lift: '0 12px 32px -12px rgba(46,90,34,.35)',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        rise: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: { marquee: 'marquee 30s linear infinite', rise: 'rise .35s ease both' },
    },
  },
  plugins: [],
};
