/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── Typography ───────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },

      // Typography scale — use as text-page-title, text-section-header, etc.
      fontSize: {
        // Page title: 24px
        'page-title':    ['1.5rem',    { lineHeight: '2rem',     fontWeight: '600', letterSpacing: '-0.02em' }],
        // Section header: 16px
        'section-header':['1rem',      { lineHeight: '1.5rem',   fontWeight: '600', letterSpacing: '-0.01em' }],
        // Card title: 14px
        'card-title':    ['0.875rem',  { lineHeight: '1.25rem',  fontWeight: '600', letterSpacing: '0'       }],
        // Label: 12px
        'label':         ['0.75rem',   { lineHeight: '1rem',     fontWeight: '500', letterSpacing: '0.02em'  }],
        // Body: 13px
        'body':          ['0.8125rem', { lineHeight: '1.25rem',  fontWeight: '400', letterSpacing: '0'       }],
        // Caption: 11px
        'caption':       ['0.6875rem', { lineHeight: '1rem',     fontWeight: '400', letterSpacing: '0.01em'  }],
      },

      // ─── Color Palette ────────────────────────────────────────────────────────

      colors: {
        // Navy — deep slate-navy, used for: sidebar bg, page headers, primary text
        // Base: #1E3A5F family
        navy: {
          50:  '#EFF4FB',
          100: '#D9E5F5',
          200: '#B3CBEB',
          300: '#8DAEDE',
          400: '#5E8AC8',
          500: '#2E69AE',
          600: '#1E3A5F', // ← brand core
          700: '#172E4D',
          800: '#0F1F35',
          900: '#091221',
          950: '#050C16',
        },

        // Accent — enterprise blue, used ONLY for: primary actions, links, active states
        // Base: #2563EB family (Tailwind blue-600 equivalent)
        accent: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB', // ← primary action color
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },

        // Neutral — full slate scale for backgrounds, borders, secondary text
        // Eliminates all hardcoded gray/white/black
        neutral: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },

        // Semantic — success (green)
        success: {
          light:   '#DCFCE7', // background for success badges/alerts
          DEFAULT: '#16A34A', // text/icon color (passes AA on white and light backgrounds)
          dark:    '#15803D', // darker variant for dark mode text
        },

        // Semantic — warning (amber)
        warning: {
          light:   '#FEF3C7',
          DEFAULT: '#D97706',
          dark:    '#B45309',
        },

        // Semantic — danger / error / destructive (red)
        danger: {
          light:   '#FEE2E2',
          DEFAULT: '#DC2626',
          dark:    '#B91C1C',
        },
      },

      // ─── Radius & Shadows ───────────────────────────────────────────────────

      borderRadius: {
        'card':   '0.375rem', // 6px
        'dialog': '0.5rem',   // 8px
        'btn':    '0.375rem', // 6px
        'input':  '0.375rem', // 6px
        'badge':  '0.25rem',  // 4px
      },

      boxShadow: {
        'card':       '0 1px 2px 0 rgb(0 0 0 / 0.15)',
        'card-hover': '0 2px 8px 0 rgb(0 0 0 / 0.15)',
        'dialog':     '0 8px 30px -6px rgb(0 0 0 / 0.5)',
        'dropdown':   '0 4px 16px -2px rgb(0 0 0 / 0.4)',
      },

      // ─── Animations ───────────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.15s ease-out',
        'slide-up':       'slide-up 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 0.15s ease-out',
      },
    },
  },
  plugins: [],
}
