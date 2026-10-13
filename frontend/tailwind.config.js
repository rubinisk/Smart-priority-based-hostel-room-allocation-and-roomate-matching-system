/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          canvas: "#edf0f7",
          dark: "#edf0f7",          // light grayish periwinkle portal canvas
          surface: "#ffffff",       // pure white cards
          card: "#ffffff",          // pure white cards
          cardMuted: "#f8fafc",     // soft off-white secondary surfaces
          border: "#cbd5e1",        // slate-300 clean crisp border
          pink: "#bf0c4e",          // rich maroon / crimson
          hoverPink: "#9f0a41",     // deep maroon hover
          maroon: "#bf0c4e",
          maroonHover: "#9f0a41",
          maroonDark: "#800834",
          maroonLight: "#fdf2f6",
          lavender: "#bf0c4e",
          textMuted: "#334155",     // crisp slate-700 for high-contrast readable subtext
          textDark: "#0f172a",      // deep slate-900
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
