// @ts-nocheck
import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-26',
  future: {
    compatibilityVersion: 4,
  },

  runtimeConfig: {
    aiKey: process.env.AI_KEY || 'AQ.Ab8RN6KCz43cE76MxH4xfu2htCVlOnRpWllh0xiUf_wxyw_c7w',
    isProduction: process.env.IS_PRODUCTION === 'true',
    public: {
      aiKey: process.env.AI_KEY || 'AQ.Ab8RN6KCz43cE76MxH4xfu2htCVlOnRpWllh0xiUf_wxyw_c7w',
      isProduction: process.env.IS_PRODUCTION === 'true',
    },
  },

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxtjs/google-fonts'],

  css: ['~/assets/css/main.css'],

  googleFonts: {
    families: {
      Inter: [300, 400, 500, 600],
      Newsreader: [300, 400],
      'JetBrains+Mono': [400, 600],
    },
    display: 'swap',
  },

  ssr: true,



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
}) as any
