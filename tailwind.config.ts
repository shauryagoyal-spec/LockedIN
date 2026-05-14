import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // GrindOS brand — hot orange, "you're on fire" tone
        brand: {
          50:  '#fff4ed',
          100: '#ffe6d4',
          200: '#ffc8a8',
          300: '#ffa172',
          400: '#ff8147',
          500: '#ff5b1f', // primary
          600: '#e64210',
          700: '#c44715',
          800: '#8a2f0e',
          900: '#3a1404',
        },
      },
      fontFamily: {
        // System stack — no external load. Add 'Inter Tight' here if you load it via next/font.
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'brand-glow': '0 8px 24px -8px rgba(255, 91, 31, 0.5)',
      },
    },
  },
  plugins: [],
}

export default config
