<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-bgPanel text-textPrimary">
    <div class="flex flex-col items-center gap-4 text-center max-w-sm">
      <span class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
      <h1 class="font-editorial text-2xl font-light">Conectando sua conta...</h1>
      <p class="text-xs text-textSecondary font-interface">
        Concluindo autenticação segura. Esta janela será fechada automaticamente em instantes.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

onMounted(() => {
  if (typeof window === 'undefined') return

  const code = (route.query.code as string) || null
  const error = (route.query.error as string) || null

  if (window.opener) {
    if (code) {
      window.opener.postMessage({ type: 'ARESTA_OAUTH_CODE', code }, '*')
    } else if (error) {
      window.opener.postMessage({ type: 'ARESTA_OAUTH_ERROR', error }, '*')
    }
    setTimeout(() => {
      window.close()
    }, 300)
  } else {
    // Se aberto fora de popup, redireciona para a página inicial
    navigateTo('/')
  }
})
</script>
