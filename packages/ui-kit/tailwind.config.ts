import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './stories/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Poppins"', 'var(--font-display)', 'sans-serif'],
        body: ['"Inter"', 'var(--font-body)', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#7aa5d6',
          secondary: '#f9d8ff',
          accent: '#ec4899',
          ink: '#0f172a',
        },
      },
      borderRadius: {
        lg: '1rem',
        pill: '999px',
      },
    },
  },
  plugins: [],
}

export default config
