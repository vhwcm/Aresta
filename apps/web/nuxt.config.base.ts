// @ts-nocheck
import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  telemetry: false,
  devServer: {
    host: '0.0.0.0',
    port: 3000,
  },
  compatibilityDate: '2025-07-26',
  future: {
    compatibilityVersion: 4,
  },

  runtimeConfig: {
    aiKey: process.env.AI_KEY || '',
    isProduction: process.env.IS_PRODUCTION === 'true',
    public: {
      aiKey: process.env.AI_KEY || '',
      isProduction: process.env.IS_PRODUCTION === 'true',
    },
  },

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxtjs/google-fonts'],

  tailwindcss: {
    configPath: 'tailwind.config.cjs',
    viewer: false,
  },

  css: ['~/assets/css/main.css'],

  googleFonts: {
    families: {
      Inter: [300, 400, 500, 600],
      Newsreader: [300, 400],
      'JetBrains+Mono': [400, 600],
      MedievalSharp: [400],
      Almendra: [400, 700],
    },
    display: 'swap',
    download: false,
  },

  ssr: false,

  vite: {
    optimizeDeps: {
      exclude: ['pdfjs-dist'],
    },
    worker: {
      format: 'es',
    },
  },

  nitro: {
    prerender: {
      crawlLinks: false,
      failOnError: false,
    },
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
      title: 'Aresta',
      titleTemplate: 'Aresta',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Leitor online de PDF e EPUB com efeito de virada de página realista.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'shortcut icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },
}) as any
