/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1a1f2e',
        primary: {
          DEFAULT: '#F6A469',
          dark: '#f59651',
        },
        secondary: {
          DEFAULT: '#DA8680',
          dark: '#d47069',
        },
        accent: {
          DEFAULT: '#F9CB8F',
          dark: '#f8bf73',
        },
        highlight: {
          DEFAULT: '#F3D3CA',
          dark: '#eec1b5',
        },
        muted: {
          DEFAULT: '#C0C18D',
          dark: '#b4b579',
        },
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'sm': '0 2px 4px 0 rgb(0 0 0 / 0.1)',
        DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'md': '0 8px 12px -2px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'lg': '0 12px 24px -4px rgb(0 0 0 / 0.2), 0 8px 12px -6px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
}