import { isProductionMode } from '~/utils/logger'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    if (!isProductionMode()) {
      console.error('[Nuxt Error Handler]', err, info)
    }
  }

  nuxtApp.hook('vue:error', (_err, _instance, _info) => {
    if (isProductionMode()) {
      // Ignorar erros em produção
    }
  })
})
