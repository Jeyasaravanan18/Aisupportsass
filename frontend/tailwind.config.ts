/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sidebar
        sidebar: {
          DEFAULT: '#0f1117',
          item:    '#1a1d27',
          active:  '#1e2130',
          border:  '#2a2d3e',
          text:    '#9ca3af',
        },
        // Main surface (light)
        surface: {
          DEFAULT: '#f2f4f7',
          card:    '#ffffff',
          border:  '#e5e7eb',
          hover:   '#f9fafb',
          muted:   '#f3f4f6',
        },
        // Brand / primary
        brand: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Accent teal (active highlights)
        accent: '#0ea5e9',
        // Text
        ink: {
          DEFAULT: '#111827',
          muted:   '#6b7280',
          subtle:  '#9ca3af',
          inverse: '#f9fafb',
        },
        // Status
        positive: { DEFAULT: '#16a34a', bg: '#dcfce7', text: '#15803d' },
        negative: { DEFAULT: '#dc2626', bg: '#fee2e2', text: '#b91c1c' },
        warning:  { DEFAULT: '#d97706', bg: '#fef3c7', text: '#b45309' },
        // Risk
        risk: {
          low:    '#22c55e',
          medium: '#f59e0b',
          high:   '#ef4444',
        },
        // Chat bubbles
        bubble: {
          customer: '#dbeafe',
          agent:    '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #0f1117 0%, #0d1020 100%)',
      },
      boxShadow: {
        card:   '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        card2:  '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        panel:  '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-ring': 'pulseRing 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':    'shimmer 1.5s infinite',
        'bounce-dot': 'bounceDot 1.2s infinite ease-in-out',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseRing: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        bounceDot: { '0%, 80%, 100%': { transform: 'scale(0)' }, '40%': { transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
