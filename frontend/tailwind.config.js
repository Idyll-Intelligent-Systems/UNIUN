module.exports = {
  content: ['./pages/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        galaxy: '#0b0b0f',
        gold: '#d4af37',
        burgundy: '#7b002c',
        tangerine: '#ff7f50',
        olive: '#556b2f'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
