/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E2773A',
          dark: '#d66a31',
        },
        secondary: '#FFCB68',
        background: '#0C0F1E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      typography: (theme) => ({
        invert: {
          css: {
            '--tw-prose-body': theme('colors.white / 80'),
            '--tw-prose-headings': theme('colors.white'),
            '--tw-prose-lead': theme('colors.white / 70'),
            '--tw-prose-links': theme('colors.primary.DEFAULT'),
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-counters': theme('colors.white / 60'),
            '--tw-prose-bullets': theme('colors.white / 60'),
            '--tw-prose-hr': theme('colors.white / 10'),
            '--tw-prose-quotes': theme('colors.white / 80'),
            '--tw-prose-quote-borders': theme('colors.primary.DEFAULT'),
            '--tw-prose-captions': theme('colors.white / 60'),
            '--tw-prose-code': theme('colors.white'),
            '--tw-prose-pre-code': theme('colors.white'),
            '--tw-prose-pre-bg': 'rgb(0 0 0 / 0.2)',
            '--tw-prose-th-borders': theme('colors.white / 10'),
            '--tw-prose-td-borders': theme('colors.white / 5'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};