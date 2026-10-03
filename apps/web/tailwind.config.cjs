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
        bgApp: 'var(--bg-app, #0c0d0f)',
        bgRoot: 'var(--bg-root, var(--bg-panel, #0c0d0f))',
        bgPanel: 'var(--bg-panel, #0c0d0f)',
        bgElevated: 'var(--bg-elevated, var(--bg-panel, #0c0d0f))',
        bgSurface: 'var(--bg-surface, var(--bg-panel, #0c0d0f))',
        bgDarker: 'var(--bg-app, #090a0c)',
        textPrimary: 'var(--text-primary, #F2F2F2)',
        textSecondary: 'var(--text-secondary, #7A7D84)',
        accent: 'var(--accent, #BF6E41)',
        primary: 'var(--accent, #BF6E41)',
        primaryHover: '#A85E35',
        divider: 'var(--divider, rgba(255, 255, 255, 0.08))',
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

