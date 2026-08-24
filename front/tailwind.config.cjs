/** @type {import('tailwindcss').Config} */
module.exports = {
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
        bgApp: '#0A0A0B',
        bgPanel: '#121315',
        textPrimary: '#F2F2F2',
        textSecondary: '#7A7D84',
        accent: '#E57B55',
        divider: 'rgba(255, 255, 255, 0.06)',
      },
      fontFamily: {
        interface: ['Inter', 'sans-serif'],
        editorial: ['Newsreader', 'serif'],
        technical: ['"JetBrains Mono"', 'monospace'],
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

