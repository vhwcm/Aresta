import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-26',
  future: {
    compatibilityVersion: 4,
  },

  modules: ['@pinia/nuxt'],

  ssr: true,

  alias: {
    'foliate-js': fileURLToPath(new URL('./lib/foliate-js', import.meta.url)),
  },

  vite: {
    optimizeDeps: {
      exclude: ['pdfjs-dist'],
    },
    worker: {
      format: 'es',
    },
  },

  nitro: {
    publicAssets: [
      {
        dir: 'public',
        maxAge: 60 * 60 * 24 * 7,
      },
    ],
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  app: {
    head: {
      title: 'Aresta — Leitor de PDF e EPUB',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Leitor online de PDF e EPUB com efeito de virada de página realista.',
        },
      ],
    },
  },
})
