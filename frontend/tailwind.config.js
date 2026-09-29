/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SIET Official Brand Tokens — Deep Forest Green, Emerald Green, Clean White, Academic Gold/Yellow
        brand: {
          forest:  '#074828',   // Deep green headers/footers
          green:   '#0B6A3E',   // Primary buttons, active states
          emerald: '#16A34A',   // Success pills, active tabs
          light:   '#ECFDF5',   // Soft green tint for subtle backgrounds
          gold:    '#FACC15',   // Yellow accent borders & active indicators
          amber:   '#EAB308',   // Warm crest yellow
        },
        siet: {
          navy:    '#074828',   // Deep institutional forest green (replaces navy)
          blue:    '#0B6A3E',   // Primary institutional green (replaces blue)
          sky:     '#0B6A3E',   // Primary CTA green (replaces blue-600)
          sky600:  '#074828',   // CTA hover deep green
          emerald: '#16A34A',   // Vibrant emerald green
          light:   '#ECFDF5',   // Soft green tint
          gold:    '#FACC15',   // Academic Golden Yellow
          amber:   '#EAB308',   // Warm crest yellow
          silver:  '#F0FDF4',   // Light green-tinted off-white panel
          slate:   '#334155',   // Slate body text
          muted:   '#64748B',   // Placeholder / muted text
          border:  '#E2E8F0',   // Dividers & borders
          success: '#16A34A',   // Verified / success emerald
          error:   '#B91C1C',   // Failure / mandatory indicator
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
        'card':   '0 1px 3px 0 rgba(7, 72, 40, 0.08), 0 1px 2px -1px rgba(7, 72, 40, 0.06)',
        'card-md':'0 4px 12px 0 rgba(7, 72, 40, 0.12), 0 2px 4px -2px rgba(7, 72, 40, 0.08)',
        'header': '0 2px 4px 0 rgba(7, 72, 40, 0.06)',
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
