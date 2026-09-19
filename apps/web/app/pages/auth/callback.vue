<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-bgPanel text-textPrimary">
    <div v-if="errorMessage" class="flex flex-col items-center gap-4 text-center max-w-sm">
      <div class="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 class="font-editorial text-2xl font-light text-rose-500">Erro na Autenticação</h1>
      <p class="text-xs text-textSecondary font-interface">
        {{ errorMessage }}
      </p>
      <NuxtLink
        to="/login"
        class="mt-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-interface font-medium transition-transform active:scale-95"
      >
        Tentar Novamente
      </NuxtLink>
    </div>

    <div v-else class="flex flex-col items-center gap-4 text-center max-w-sm">
      <span class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
      <h1 class="font-editorial text-2xl font-light">Conectando sua conta...</h1>
      <p class="text-xs text-textSecondary font-interface">
        Concluindo autenticação segura. Você será redirecionado em instantes.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getApiRoot, getOAuthRedirectUri } from '~/utils/apiBase'
import { purgeClientSession, type AuthUser } from '~/composables/useAuth'

const route = useRoute()
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  if (typeof window === 'undefined') return

  const code = (route.query.code as string) || null
  const error = (route.query.error as string) || null
  const provider = ((route.query.provider as string) || 'google').toLowerCase()

  if (error) {
    errorMessage.value = `Autorização cancelada ou recusada: ${error}`
    if (window.opener) {
      window.opener.postMessage({ type: 'ARESTA_OAUTH_ERROR', error }, '*')
      setTimeout(() => window.close(), 1500)
    }
    return
  }

  if (!code) {
    errorMessage.value = 'Nenhum código de autorização foi retornado pelo provedor.'
    return
  }

  // 1. Se estiver dentro de uma popup (Desktop Browser com window.opener)
  if (window.opener) {
    window.opener.postMessage({ type: 'ARESTA_OAUTH_CODE', code }, '*')
    setTimeout(() => {
      window.close()
    }, 400)
    return
  }

  // 2. Se for redirecionamento direto (Mobile Browser, WebView, Standalone App)
  try {
    const authUrl = getApiRoot()
    const redirectUri = getOAuthRedirectUri()

    const response = await $fetch<{
      token: string
      user: AuthUser
      isNewUser?: boolean
      oauth: { provider: string; scope?: string }
    }>(`${authUrl}/api/auth/oauth/${provider}/callback`, {
      method: 'POST',
      body: { code, redirectUri },
    })

    const tokenCookie = useCookie<string | null>('aresta_token', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    })
    const userCookie = useCookie<AuthUser | null>('aresta_user', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    })

    await purgeClientSession()

    tokenCookie.value = response.token
    userCookie.value = response.user

    if (provider === 'google' && typeof localStorage !== 'undefined') {
      localStorage.setItem('aresta_drive_provider', 'google')
    }

    // Redireciona com sucesso para a Home
    window.location.href = '/'
  } catch (err: any) {
    console.error('[OAuth Callback] Erro ao trocar código:', err)
    errorMessage.value = err?.data?.error || err?.message || 'Falha ao concluir autenticação.'
  }
})
</script>
