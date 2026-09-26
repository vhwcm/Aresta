<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-bgPanel text-textPrimary select-none">
    <!-- Estado de Erro -->
    <div v-if="errorMessage" class="flex flex-col items-center gap-4 text-center max-w-sm animate-in fade-in duration-300">
      <div class="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 class="font-editorial text-2xl font-light text-rose-500">Erro na Autenticação</h1>
      <p class="text-xs text-textSecondary font-interface leading-relaxed">
        {{ errorMessage }}
      </p>
      <NuxtLink
        to="/login"
        class="mt-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-interface font-medium transition-transform active:scale-95 shadow-md"
      >
        Tentar Novamente
      </NuxtLink>
    </div>

    <!-- Estado de Sucesso / Redirecionamento -->
    <div v-else-if="isSuccess" class="flex flex-col items-center gap-4 text-center max-w-sm animate-in fade-in duration-300">
      <div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 class="font-editorial text-2xl font-light text-textPrimary">Autenticado com Sucesso!</h1>
      <p class="text-xs text-textSecondary font-interface">
        Sua sessão foi iniciada. Redirecionando...
      </p>
      <a
        :href="targetUrl"
        class="mt-2 px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-interface font-medium shadow-md transition-transform active:scale-95"
      >
        {{ isNewUser ? 'Configurar Perfil' : 'Entrar no Aresta' }}
      </a>
    </div>

    <!-- Estado de Carregamento / Processamento -->
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
import { purgeClientSession, setSession, type AuthUser } from '~/composables/useAuth'

const route = useRoute()
const errorMessage = ref<string | null>(null)
const isSuccess = ref(false)
const isNewUser = ref(false)
const targetUrl = ref('/library')

onMounted(async () => {
  if (typeof window === 'undefined') return

  const searchParams = new URLSearchParams(window.location.search)
  const code = (route.query.code as string) || searchParams.get('code') || null
  const state = (route.query.state as string) || searchParams.get('state') || null
  const error = (route.query.error as string) || searchParams.get('error') || null
  const provider = ((route.query.provider as string) || searchParams.get('provider') || 'google').toLowerCase()

  if (error) {
    errorMessage.value = `Autorização cancelada ou recusada: ${error}`
    if (window.opener) {
      try {
        window.opener.postMessage({ type: 'ARESTA_OAUTH_ERROR', error }, '*')
      } catch {}
      setTimeout(() => {
        try { window.close() } catch {}
      }, 1000)
    }
    return
  }

  if (!code) {
    errorMessage.value = 'Nenhum código de autorização foi retornado pelo provedor.'
    return
  }

  // Executa a troca direta do token no backend (fonte única de verdade)
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
      body: { code, redirectUri, state },
    })

    if (!response?.token) {
      throw new Error('Nenhum token foi retornado pelo servidor de autenticação.')
    }

    await purgeClientSession()
    setSession(response.token, response.user)

    if (typeof localStorage !== 'undefined') {
      if (provider === 'google') {
        localStorage.setItem('aresta_drive_provider', 'google')
      }
      // Se já for usuário existente, garante a flag de onboarding para compatibilidade local
      if (response.user?.id && !response.isNewUser) {
        localStorage.setItem(`aresta_onboarding_completed_${response.user.id}`, 'true')
      }
    }

    isNewUser.value = Boolean(response.isNewUser)

    // Calcula destino correto preservando qualquer redirect pretendido
    let savedRedirect: string | null = null
    if (typeof sessionStorage !== 'undefined') {
      try {
        savedRedirect = sessionStorage.getItem('aresta_oauth_redirect')
        sessionStorage.removeItem('aresta_oauth_redirect')
      } catch {}
    }

    if (response.isNewUser) {
      targetUrl.value = '/onboarding'
    } else {
      targetUrl.value = (savedRedirect && savedRedirect !== '/') ? savedRedirect : '/library'
    }

    // Se window.opener estiver disponível, notifica com o token e dados prontos
    if (window.opener) {
      try {
        window.opener.postMessage({
          type: 'ARESTA_OAUTH_SUCCESS',
          code,
          token: response.token,
          user: response.user,
          isNewUser: response.isNewUser,
          oauth: response.oauth,
        }, '*')
      } catch {}
      try { window.close() } catch {}
    }

    isSuccess.value = true

    // Redireciona para o aplicativo (Biblioteca ou Onboarding)
    setTimeout(() => {
      window.location.replace(targetUrl.value)
    }, 400)
  } catch (err: any) {
    console.error('[OAuth Callback] Erro ao autenticar:', err)
    errorMessage.value = err?.data?.error || err?.message || 'Falha ao concluir autenticação.'
  }
})
</script>
