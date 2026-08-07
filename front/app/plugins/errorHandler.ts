import { isProductionMode } from '~/utils/logger'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    if (!isProductionMode()) {
      console.error('[Nuxt Error Handler]', err, info)
    }
  }

  nuxtApp.hook('vue:error', (err, instance, info) => {
    if (isProductionMode()) {
      return false
    }
  })
})
