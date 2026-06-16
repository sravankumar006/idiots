/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        'neo-bg': 'var(--neo-bg)',
        'neo-text': 'var(--neo-text-primary)',
        'neo-secondary': 'var(--neo-text-secondary)',
        'neo-muted': 'var(--neo-text-muted)',
        'neo-purple': '#7c3aed'
      },
      boxShadow: {
        'neo': '6px 6px 14px var(--shadow-flat-dark), -6px -6px 10px var(--shadow-flat-light)',
        'neo-high': '10px 10px 20px var(--shadow-flat-dark), -10px -10px 16px var(--shadow-flat-light)',
        'neo-shallow': '3px 3px 6px var(--shadow-flat-dark), -3px -3px 6px var(--shadow-flat-light)',
        'neo-inset': 'inset 5px 5px 10px var(--shadow-inset-dark), inset -5px -5px 10px var(--shadow-inset-light)',
        'neo-inset-shallow': 'inset 2.5px 2.5px 5px var(--shadow-inset-dark), inset -2.5px -2.5px 5px var(--shadow-inset-light)'
      }
    }
  },
  plugins: []
}
