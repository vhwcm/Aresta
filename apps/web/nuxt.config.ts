// @ts-nocheck
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
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL ?? 'http://localhost:3001',
      readerApiUrl: process.env.NUXT_PUBLIC_READER_API_URL ?? 'http://localhost:3001',
      memoryApiUrl: process.env.NUXT_PUBLIC_MEMORY_API_URL ?? 'http://localhost:3001',
      aiApiUrl: process.env.NUXT_PUBLIC_AI_API_URL ?? 'http://localhost:3001',
      authApiUrl: process.env.NUXT_PUBLIC_AUTH_API_URL ?? 'http://localhost:3001',
      canvasApiUrl: process.env.NUXT_PUBLIC_CANVAS_API_URL ?? 'http://localhost:3001',
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
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  app: {
    head: {
      title: 'Aresta Reader',
      titleTemplate: 'Aresta Reader',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Leitor online de EPUB e PDF com retenção de conhecimento via IA.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },
}) as any

