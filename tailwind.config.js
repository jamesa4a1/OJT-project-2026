/** @type {import('tailwindcss').Config} */
const { heroui } = require("@heroui/react");

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'doj-navy': '#1E3A8A',
        'doj-blue': '#0EA5E9',
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(14, 165, 233, 0.6)' },
        },
      },
    },
  },
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#1E3A8A",
              foreground: "#ffffff",
            },
            secondary: {
              DEFAULT: "#0EA5E9",
              foreground: "#ffffff",
            },
            success: {
              DEFAULT: "#36D399",
              foreground: "#ffffff",
            },
            warning: {
              DEFAULT: "#FBBD23",
              foreground: "#000000",
            },
            danger: {
              DEFAULT: "#F87272",
              foreground: "#ffffff",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#3B82F6",
              foreground: "#ffffff",
            },
            secondary: {
              DEFAULT: "#38BDF8",
              foreground: "#ffffff",
            },
            success: {
              DEFAULT: "#36D399",
              foreground: "#ffffff",
            },
            warning: {
              DEFAULT: "#FBBD23",
              foreground: "#000000",
            },
            danger: {
              DEFAULT: "#F87272",
              foreground: "#ffffff",
            },
          },
        },
      },
    }),
  ],
}
