/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: '#15151e',
        'surface-hover': '#1e1e2d',
        primary: '#4f46e5',
        'primary-hover': '#6366f1',
        secondary: '#1e293b',
        'secondary-hover': '#334155',
        accent: '#8b5cf6',
        success: '#10b981',
        danger: '#ef4444',
        text: '#f8fafc',
        'text-muted': '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slide: {
          '0%': { backgroundPosition: '0% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        },
        shrink: {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        }
      }
    },
  },
  plugins: [],
}
