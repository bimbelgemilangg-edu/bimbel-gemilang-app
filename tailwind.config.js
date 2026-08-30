// tailwind.config.js
// Taruh di root project (sejajar dengan package.json)
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './index.html',
      './src/**/*.{js,jsx,ts,tsx}',  // ← scan SEMUA file di src/ otomatis
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  };