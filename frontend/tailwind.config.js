/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',      // Indigo
        secondary: '#10B981',    // Green
        background: '#1F2937',   // Dark Gray
        surface: '#374151',      // Medium Gray
        'surface-light': '#4B5563', // Light Gray
      },
    },
  },
  plugins: [],
}

// Made with Bob
