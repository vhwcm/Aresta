/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"], .dark-theme, .dark'],
  content: [
    './app/components/**/*.{js,vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/plugins/**/*.{js,ts}',
    './app/app.vue',
    './app/error.vue'
  ],
  theme: {
    extend: {
      colors: {
        bgApp: 'var(--bg-app, #0A0A0B)',
        bgRoot: 'var(--bg-app, #0A0A0B)',
        bgPanel: 'var(--bg-panel, #121315)',
        bgElevated: 'var(--bg-panel, #121315)',
        bgSurface: 'var(--bg-panel, #121315)',
        textPrimary: 'var(--text-primary, #F2F2F2)',
        textSecondary: 'var(--text-secondary, #7A7D84)',
        accent: 'var(--accent, #E57B55)',
        primary: 'var(--accent, #E57B55)',
        primaryHover: '#D46944',
        divider: 'var(--divider, rgba(255, 255, 255, 0.06))',
      },
      fontFamily: {
        interface: ['Inter', 'sans-serif'],
        editorial: ['Newsreader', 'serif'],
        technical: ['"JetBrains Mono"', 'monospace'],
        medieval: ['MedievalSharp', 'Almendra', '"Cinzel Decorative"', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'grid-pattern': 'radial-gradient(circle, #333 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-size': '24px 24px',
      }
    },
  },
  plugins: [],
}

