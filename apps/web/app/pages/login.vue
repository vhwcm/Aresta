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

      <!-- Coluna da Direita: Card de Autenticação com Abas Login / Cadastro -->
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

        <!-- Alternador de Abas: Login / Cadastro -->
        <div class="flex items-center p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-divider">
          <button
            type="button"
            @click="authMode = 'login'"
            data-testid="tab-login"
            class="flex-1 py-2 rounded-xl font-interface text-xs font-medium transition-all text-center cursor-pointer"
            :class="authMode === 'login' ? 'bg-accent text-white shadow-md' : 'text-textSecondary hover:text-textPrimary'"
          >
            Acessar Conta
          </button>
          <button
            type="button"
            @click="authMode = 'register'"
            data-testid="tab-register"
            class="flex-1 py-2 rounded-xl font-interface text-xs font-medium transition-all text-center cursor-pointer"
            :class="authMode === 'register' ? 'bg-accent text-white shadow-md' : 'text-textSecondary hover:text-textPrimary'"
          >
            Criar Conta
          </button>
        </div>

        <!-- Alerta de Erro de Autenticação -->
        <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 flex items-center gap-2">
          <AlertCircleIcon class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Formulário de Login -->
        <form v-if="authMode === 'login'" @submit.prevent="handleLogin" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
              Usuário ou E-mail
            </label>
            <div class="relative">
              <UserIcon class="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="loginId"
                type="text"
                required
                data-testid="login-input"
                placeholder="seu.usuario ou e-mail"
                class="w-full bg-black/[0.03] dark:bg-black/40 border border-divider rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
              Senha
            </label>
            <div class="relative">
              <LockIcon class="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="password"
                type="password"
                required
                data-testid="password-input"
                placeholder="••••••••••••"
                class="w-full bg-black/[0.03] dark:bg-black/40 border border-divider rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            data-testid="submit-login-btn"
            class="w-full mt-2 bg-textPrimary text-bgApp font-interface font-medium text-xs sm:text-sm py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <span v-if="!isLoading">Entrar no Aresta</span>
            <span v-else class="flex items-center gap-2">
              <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              Acessando...
            </span>
            <ArrowRightIcon v-if="!isLoading" class="w-4 h-4" />
          </button>
        </form>

        <!-- Formulário de Cadastro / Criar Conta -->
        <form v-else @submit.prevent="handleRegister" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
              Nome Completo
            </label>
            <div class="relative">
              <UserIcon class="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="registerName"
                type="text"
                required
                data-testid="register-name-input"
                placeholder="Seu Nome"
                class="w-full bg-black/[0.03] dark:bg-black/40 border border-divider rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
              E-mail
            </label>
            <div class="relative">
              <MailIcon class="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="registerEmail"
                type="email"
                required
                data-testid="register-email-input"
                placeholder="seu.email@exemplo.com"
                class="w-full bg-black/[0.03] dark:bg-black/40 border border-divider rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
              Senha (mínimo 6 caracteres)
            </label>
            <div class="relative">
              <LockIcon class="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="registerPassword"
                type="password"
                required
                minlength="6"
                data-testid="register-password-input"
                placeholder="••••••••••••"
                class="w-full bg-black/[0.03] dark:bg-black/40 border border-divider rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            data-testid="submit-register-btn"
            class="w-full mt-2 bg-accent text-white font-interface font-medium text-xs sm:text-sm py-3 rounded-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50 cursor-pointer"
          >
            <span v-if="!isLoading">Criar Conta e Começar</span>
            <span v-else class="flex items-center gap-2">
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Criando conta...
            </span>
            <ArrowRightIcon v-if="!isLoading" class="w-4 h-4" />
          </button>
        </form>

        <!-- Divisor Social OAuth -->
        <div class="relative flex items-center justify-center my-0.5">
          <div class="border-t border-divider w-full"></div>
          <span class="bg-bgPanel/90 dark:bg-bgApp/60 px-3 text-[10px] font-technical uppercase tracking-widest text-textSecondary/70 shrink-0">
            ou continue com
          </span>
        </div>

        <!-- Botão Google OAuth e Provedores Adicionais -->
        <div class="flex flex-col gap-2.5">
          <button
            type="button"
            @click="handleOAuthLogin('google')"
            :disabled="isLoggingIn || isLoading"
            data-testid="oauth-google-btn"
            class="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-divider hover:border-accent/60 bg-white/5 hover:bg-white/10 text-textPrimary text-xs sm:text-sm font-interface font-medium transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span v-if="!isLoggingIn">Continuar com Google</span>
            <span v-else class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              Conectando com Google...
            </span>
          </button>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="handleOAuthLogin('microsoft')"
              :disabled="isLoggingIn || isLoading"
              data-testid="oauth-microsoft-btn"
              class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-divider hover:border-divider/80 bg-white/[0.02] hover:bg-white/5 text-textSecondary hover:text-textPrimary text-xs font-interface transition-all cursor-pointer disabled:opacity-50"
              title="Entrar com conta Microsoft / OneDrive"
            >
              <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
              <span>Microsoft</span>
            </button>

            <button
              type="button"
              @click="handleOAuthLogin('apple')"
              :disabled="isLoggingIn || isLoading"
              data-testid="oauth-apple-btn"
              class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-divider hover:border-divider/80 bg-white/[0.02] hover:bg-white/5 text-textSecondary hover:text-textPrimary text-xs font-interface transition-all cursor-pointer disabled:opacity-50"
              title="Entrar com Apple Account"
            >
              <svg class="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.59-7.71-11.66-14-5.65-8.8-10.15-18.9-13.49-30.31-3.34-11.41-5.01-22.3-5.01-32.68 0-16.74 4.1-30.56 12.3-41.46 8.2-10.9 18.59-16.48 31.18-16.74 5.34 0 11.22 1.48 17.65 4.44 6.42 2.96 10.59 4.49 12.51 4.58 1.53 0 5.86-1.56 12.98-4.68 7.12-3.12 13.06-4.44 17.82-3.97 13.78 1.04 24.62 6.55 32.52 16.53-12.02 7.28-17.9 17.29-17.64 30.03.26 10.08 4.1 18.5 11.53 25.26 7.42 6.76 16.29 10.59 26.6 11.5-2.09 6.24-4.53 12.39-7.32 18.45zM119.22 33.15c0-7.85 2.82-15.18 8.46-22 5.64-6.82 12.55-10.87 20.73-12.15.26 1.04.39 2.08.39 3.12 0 7.85-3.03 15.42-9.08 22.7-6.05 7.28-13.15 11.35-21.3 12.21-.13-1.3-.2-2.6-.2-3.88z"/>
              </svg>
              <span>Apple</span>
            </button>
          </div>
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
