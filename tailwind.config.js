
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          light: 'hsl(var(--primary-light))',
          dark: 'hsl(var(--primary-dark))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        surface: 'hsl(var(--card) / 0.72)',
        'surface-muted': 'hsl(var(--muted) / 0.65)',
        text: {
          primary: 'hsl(var(--foreground))',
          secondary: 'hsl(var(--muted-foreground))',
          tertiary: 'hsl(var(--muted-foreground) / 0.75)',
        },
        success: {
          DEFAULT: 'hsl(var(--primary))',
          light: 'hsl(var(--accent))',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        error: {
          DEFAULT: 'hsl(var(--destructive))',
          light: '#FEE2E2',
        },
        ios: {
          separator: 'rgba(255,255,255,0.35)',
          fill: 'rgba(255,255,255,0.25)',
        },
        ink: {
          DEFAULT: '#0F1520',
          muted: '#6B7280',
          soft: '#9CA3AF',
        },
        sea: {
          50: '#EEF5F7',
          100: '#D7E7EC',
          200: '#AACCD6',
          400: '#3F8296',
          500: '#1D6274',
          600: '#164E5F',
          700: '#0F3946',
        },
        sand: {
          50: '#F7F8FA',
          100: '#F0F2F6',
          200: '#E3E7EE',
        },
        coral: {
          100: '#FBE4E2',
          400: '#F08F89',
          500: '#E8756E',
          600: '#D2564F',
        },
        line: '#E5E7EB',
      },
      fontFamily: {
        sans: ['DM Sans', 'Plus Jakarta Sans', 'Inter', 'Noto Sans Ethiopic', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        ios: '12px',
        'ios-md': '14px',
        'ios-lg': '16px',
        'ios-xl': '20px',
      },
      boxShadow: {
        'ios-xs': '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
        'ios-sm': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5)',
        'ios-md': '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.45)',
        'ios-lg': '0 4px 16px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
        'ios-glow': '0 4px 20px rgba(13,148,136,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
        'horizon': '0 8px 32px rgba(13,148,136,0.16), 0 2px 8px rgba(249,115,22,0.1)',
        'horizon-lg': '0 16px 48px rgba(13,148,136,0.2), 0 4px 16px rgba(249,115,22,0.1)',
        glass: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.55)',
        soft: '0 10px 30px -18px rgba(15, 21, 32, 0.45)',
        glow: '0 10px 30px rgba(22, 78, 95, 0.38)',
      },
      backdropBlur: {
        glass: '20px',
        'glass-lg': '28px',
      },
      transitionDuration: {
        ios: '250ms',
      },
      transitionTimingFunction: {
        ios: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        swift: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      animation: {
        skeleton: 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        skeleton: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
    },
  },
  plugins: [],
}
