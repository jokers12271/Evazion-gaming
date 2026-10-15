/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Scan @blinkdotnew/ui so its Tailwind classes aren't purged
    "./node_modules/@blinkdotnew/ui/dist/index.mjs",
  ],
  theme: {
    extend: {
      // ── Border radius — must match @blinkdotnew/ui's tailwind.config.ts ──
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        full: 'var(--radius-full)',
        DEFAULT: 'var(--radius-md)',
      },

      // ── Box shadows — must match @blinkdotnew/ui's tailwind.config.ts ────
      boxShadow: {
        sm:      'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md:      'var(--shadow-md)',
        lg:      'var(--shadow-lg)',
        xl:      'var(--shadow-xl)',
        card:    'var(--shadow-card)',
        'neon-violet': '0 0 25px -4px hsla(270, 95%, 65%, 0.4), 0 0 10px -2px hsla(270, 95%, 65%, 0.25)',
        'neon-cyan': '0 0 25px -4px hsla(185, 100%, 50%, 0.4), 0 0 10px -2px hsla(185, 100%, 50%, 0.25)',
        'neon-orange': '0 0 25px -4px hsla(25, 100%, 55%, 0.4), 0 0 10px -2px hsla(25, 100%, 55%, 0.25)',
        'neon-emerald': '0 0 25px -4px hsla(142, 80%, 48%, 0.4), 0 0 10px -2px hsla(142, 80%, 48%, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.65)',
      },

      // ── Font families — resolve to per-theme CSS vars ─────────────────────
      fontFamily: {
        sans:    'var(--font-sans)',
        display: 'var(--font-display)',
        heading: 'var(--font-heading)',
        mono:    'var(--font-mono)',
        serif:   ['Georgia', 'serif'],
      },

      // ── Font sizes ─────────────────────────────────────────────────────────
      fontSize: {
        xs:   ['var(--font-size-xs)',   { lineHeight: 'var(--line-height-tight)' }],
        sm:   ['var(--font-size-sm)',   { lineHeight: 'var(--line-height-normal)' }],
        base: ['var(--font-size-base)', { lineHeight: 'var(--line-height-normal)' }],
        lg:   ['var(--font-size-lg)',   { lineHeight: 'var(--line-height-relaxed)' }],
        xl:   ['var(--font-size-xl)',   { lineHeight: 'var(--line-height-heading)' }],
        '2xl':['var(--font-size-2xl)',  { lineHeight: 'var(--line-height-heading)' }],
      },

      // ── Colors ─────────────────────────────────────────────────────────────
      colors: {
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT:              'hsl(var(--sidebar))',
          foreground:           'hsl(var(--sidebar-foreground))',
          primary:              'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent:               'hsl(var(--sidebar-accent))',
          'accent-foreground':  'hsl(var(--sidebar-accent-foreground))',
          border:               'hsl(var(--sidebar-border))',
          ring:                 'hsl(var(--sidebar-ring))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },

      // ── Transitions ────────────────────────────────────────────────────────
      transitionDuration: {
        fast:    'var(--duration-fast)',
        DEFAULT: 'var(--duration-normal)',
        slow:    'var(--duration-slow)',
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--easing-default)',
        smooth:  'var(--easing-smooth)',
        bounce:  'var(--easing-bounce)',
      },

      // ── Animations ─────────────────────────────────────────────────────────
      animation: {
        'fade-in':       'fade-in 0.5s ease-out',
        'slide-up':      'slide-up 0.5s ease-out',
        'accordion-down':'accordion-down 0.2s ease-out',
        'accordion-up':  'accordion-up 0.2s ease-out',
        'glow':          'glow 2s ease-in-out infinite alternate',
        'pulse-glow':    'pulse-glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':       'shimmer 2.5s infinite',
        'float':         'float 4s ease-in-out infinite',
      },
      keyframes: {
        'glow': {
          '0%': { boxShadow: '0 0 5px hsla(var(--primary), 0.2)' },
          '100%': { boxShadow: '0 0 20px hsla(var(--primary), 0.6)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
