import type { Config } from 'tailwindcss'

const config = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Neobrutalist color palette
        'neo-primary': 'rgb(var(--neo-primary))',
        'neo-secondary': 'rgb(var(--neo-secondary))',
        'neo-accent': 'rgb(var(--neo-accent))',
        'neo-warning': 'rgb(var(--neo-warning))',
        'neo-purple': 'rgb(var(--neo-purple))',
        'neo-pink': 'rgb(var(--neo-pink))',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      borderWidth: {
        '3': '3px',
        '5': '5px',
        '6': '6px',
      },
      boxShadow: {
        'neobrutalist': '8px 8px 0px 0px rgb(0 0 0)',
        'neobrutalist-hover': '12px 12px 0px 0px rgb(0 0 0)',
        'neobrutalist-active': '4px 4px 0px 0px rgb(0 0 0)',
        'neobrutalist-white': '8px 8px 0px 0px rgb(255 255 255)',
        'neobrutalist-white-hover': '12px 12px 0px 0px rgb(255 255 255)',
        'neobrutalist-white-active': '4px 4px 0px 0px rgb(255 255 255)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "bounce-in": {
          "0%": {
            transform: "scale(0.3) rotate(-10deg)",
            opacity: "0",
          },
          "50%": {
            transform: "scale(1.05) rotate(2deg)",
          },
          "70%": {
            transform: "scale(0.9) rotate(-1deg)",
          },
          "100%": {
            transform: "scale(1) rotate(0deg)",
            opacity: "1",
          },
        },
        "neon-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgb(var(--neo-primary))",
          },
          "50%": {
            boxShadow: "0 0 40px rgb(var(--neo-primary)), 0 0 60px rgb(var(--neo-primary))",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-in": "bounce-in 0.6s ease-out",
        "neon-pulse": "neon-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
