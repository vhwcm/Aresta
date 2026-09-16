<template>
  <div class="min-h-[85vh] flex flex-col items-center justify-center py-8 sm:py-12 px-2 animate-in fade-in duration-500">
    <!-- Container Principal do Card em 2 Colunas -->
    <div class="w-full max-w-5xl rounded-3xl bg-bgPanel border border-divider shadow-2xl backdrop-blur-xl p-6 sm:p-10 lg:p-12 relative overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <!-- Coluna da Esquerda: Copywriting, Benefícios & Chamada de Conversão -->
        <div class="hidden lg:flex lg:col-span-7 flex-col gap-6 text-left">
          <!-- Ação Voltar ao Início na mesma altura da aba Acessar Conta -->
          <div>
            <NuxtLink
              to="/"
              data-testid="back-to-home-link"
              class="inline-flex items-center gap-2 text-textSecondary hover:text-textPrimary transition-colors font-interface text-xs sm:text-sm group py-1"
              title="Voltar para a página inicial"
            >
              <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1 text-accent" />
              <span>Voltar ao Início</span>
            </NuxtLink>
          </div>

          <h1 class="font-editorial text-3xl sm:text-4xl lg:text-5xl font-light text-textPrimary leading-[1.15]">
            Pronto para transformar sua leitura em <span class="text-accent italic">sabedoria duradoura</span>?
          </h1>

        <p class="font-interface text-sm sm:text-base text-textSecondary leading-relaxed">
          Junte-se a leitores, estudantes e pesquisadores que construíram seu segundo cérebro no Aresta. Crie sua conta gratuita em menos de 1 minuto.
        </p>

        <!-- Lista de Benefícios com Ícones de Checagem -->
        <div class="flex flex-col gap-3 pt-1 text-xs sm:text-sm text-textSecondary font-interface">
          <div class="flex items-center gap-3">
            <CheckCircle2Icon class="w-4 h-4 text-accent shrink-0" />
            <span>Leitor universal para seus arquivos EPUB e PDF</span>
          </div>
          <div class="flex items-center gap-3">
            <CheckCircle2Icon class="w-4 h-4 text-accent shrink-0" />
            <span>Grafo de conexões conceituais navegável</span>
          </div>
          <div class="flex items-center gap-3">
            <CheckCircle2Icon class="w-4 h-4 text-accent shrink-0" />
            <span>Flashcards inteligentes e repetição espaçada</span>
          </div>
          <div class="flex items-center gap-3">
            <CheckCircle2Icon class="w-4 h-4 text-accent shrink-0" />
            <span>100% livre de distrações, anúncios e algoritmos viciantes</span>
          </div>
        </div>
      </div>

      <!-- Coluna da Direita: Card de Autenticação Exclusivo com Google -->
      <div class="lg:col-span-5 w-full bg-bgPanel/90 dark:bg-bgApp/60 border border-divider backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 shrink-0">
        <NuxtLink
          to="/"
          data-testid="mobile-back-to-home-link"
          class="lg:hidden inline-flex items-center gap-2 text-textSecondary hover:text-textPrimary transition-colors font-interface text-xs group py-1"
          title="Voltar para a página inicial"
        >
          <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1 text-accent" />
          <span>Voltar ao Início</span>
        </NuxtLink>

        <!-- Cabeçalho do Card de Acesso -->
        <div class="flex flex-col gap-1.5">
          <h2 class="font-editorial text-2xl sm:text-3xl font-light text-textPrimary">
            Acessar o Aresta
          </h2>
          <p class="text-xs sm:text-sm text-textSecondary font-interface leading-relaxed">
            Acesse seus livros, anotações de leitura e grafo de conhecimento instantaneamente.
          </p>
        </div>

        <!-- Alerta de Erro de Autenticação -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-xs sm:text-sm text-rose-400 flex items-start gap-3 animate-in fade-in duration-300">
          <AlertCircleIcon class="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div class="flex flex-col gap-0.5">
            <span class="font-medium text-rose-300">Não foi possível entrar</span>
            <span class="text-rose-400/90 leading-relaxed">{{ errorMessage }}</span>
          </div>
        </div>

        <!-- Ação Principal: Botão Google OAuth -->
        <div class="flex flex-col gap-4 pt-1">
          <button
            type="button"
            @click="handleOAuthLogin('google')"
            :disabled="isLoggingIn || isLoading"
            data-testid="oauth-google-btn"
            class="w-full flex items-center justify-center gap-3.5 py-3.5 px-5 rounded-2xl border border-divider hover:border-accent/60 bg-white/10 hover:bg-white/15 dark:bg-white/5 dark:hover:bg-white/10 active:scale-[0.99] text-textPrimary text-sm sm:text-base font-interface font-medium transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 group"
          >
            <svg class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span v-if="!isLoggingIn" class="tracking-wide">Continuar com Google</span>
            <span v-else class="flex items-center gap-2 tracking-wide">
              <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              Conectando com Google...
            </span>
          </button>

          <p class="text-center text-[11px] text-textSecondary/70 font-interface leading-normal px-2">
            Autenticação segura via Google OAuth 2.0. Não compartilhamos seus dados com terceiros.
          </p>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  UserIcon,
  LockIcon,
  MailIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircle2Icon
} from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'
import { useOAuth } from '~/composables/useOAuth'
import { useSettings } from '~/composables/useSettings'

if (typeof useHead === 'function') {
  useHead({
    title: 'Acessar o Aresta — Login & Cadastro',
    meta: [
      {
        name: 'description',
        content: 'Acesse sua conta no Aresta para gerenciar seus livros, anotações de leitura e conexões conceituais.'
      }
    ]
  })
}

const route = typeof useRoute === 'function' ? useRoute() : { query: {} }
const auth = useAuth()
const { loginWithOAuth, isLoggingIn, oauthError } = useOAuth()
const { loadFromServer } = useSettings()

const authMode = ref<'login' | 'register'>('login')
const loginId = ref('')
const password = ref('')

const registerName = ref('')
const registerEmail = ref('')
const registerPassword = ref('')

const isLoading = ref(false)
const errorMessage = ref('')

onMounted(() => {
  const tabQuery = (route.query as any)?.tab || (route.query as any)?.mode
  if (tabQuery === 'register' || tabQuery === 'signup' || tabQuery === 'cadastro') {
    authMode.value = 'register'
  }
})

const getRedirectUrl = () => {
  return ((route.query as any)?.redirect as string) || '/'
}

const resetScrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }
}

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  const result = await auth.login(loginId.value, password.value)
  isLoading.value = false

  if (result.success) {
    await loadFromServer()
    resetScrollToTop()
    await navigateTo(getRedirectUrl())
  } else {
    errorMessage.value = result.error || 'Falha ao autenticar. Verifique o usuário e a senha.'
  }
}

const handleRegister = async () => {
  isLoading.value = true
  errorMessage.value = ''

  const result = await auth.register(registerName.value, registerEmail.value, registerPassword.value)
  isLoading.value = false

  if (result.success) {
    await loadFromServer()
    resetScrollToTop()
    await navigateTo('/onboarding')
  } else {
    errorMessage.value = result.error || 'Falha ao criar conta. Verifique os dados informados.'
  }
}

const handleOAuthLogin = async (provider: 'google' | 'microsoft' | 'apple') => {
  errorMessage.value = ''
  const result = await loginWithOAuth(provider)

  if (result.success) {
    await loadFromServer()
    resetScrollToTop()
    const targetUrl = (result.isNewUser || !auth.isOnboardingCompleted(result.user?.id))
      ? '/onboarding'
      : getRedirectUrl()
    await navigateTo(targetUrl)
  } else if (result.error) {
    errorMessage.value = result.error
  }
}
</script>
