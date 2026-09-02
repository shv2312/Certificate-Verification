/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SIET brand palette — deep institutional navy + professional accents
        siet: {
          navy:    '#0B1F3A',   // Deep institutional navy (primary brand)
          blue:    '#1A3A6B',   // Header / section headings
          sky:     '#2563EB',   // Interactive / CTA
          sky600:  '#1D4ED8',   // CTA hover
          silver:  '#E8ECF1',   // Light background panels
          slate:   '#475569',   // Body text
          muted:   '#94A3B8',   // Placeholder / muted text
          border:  '#CBD5E1',   // Dividers & borders
          success: '#15803D',   // Verified / success
          error:   '#B91C1C',   // Failure / mandatory indicator
          amber:   '#B45309',   // Warning / pending
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'card':   '0 1px 3px 0 rgba(11, 31, 58, 0.08), 0 1px 2px -1px rgba(11, 31, 58, 0.06)',
        'card-md':'0 4px 12px 0 rgba(11, 31, 58, 0.10), 0 2px 4px -2px rgba(11, 31, 58, 0.06)',
        'header': '0 1px 0 0 rgba(11, 31, 58, 0.10)',
      },
      borderRadius: {
        'sm2': '0.25rem',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-in-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'step-pulse':   'stepPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        stepPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
