<template>
  <div class="min-h-[85vh] flex flex-col items-center justify-center py-8 sm:py-12 px-2 animate-in fade-in duration-500">
    <!-- Header com Logo de Retorno -->
    <div class="w-full max-w-5xl flex items-center justify-between mb-6 sm:mb-8 px-2">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2.5 text-textSecondary hover:text-textPrimary transition-colors font-interface text-xs sm:text-sm group"
        title="Voltar para a página inicial"
      >
        <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1 text-accent" />
        <span>Voltar ao Início</span>
      </NuxtLink>

      <ArestaLogoGraph :size="28" to="/" />
    </div>

    <!-- Container Principal do Card em 2 Colunas -->
    <div class="w-full max-w-5xl rounded-3xl bg-bgPanel border border-divider shadow-2xl backdrop-blur-xl p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative overflow-hidden">
      <!-- Coluna da Esquerda: Copywriting, Benefícios & Chamada de Conversão -->
      <div class="lg:col-span-7 flex flex-col gap-6 text-left">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-technical text-[10px] uppercase tracking-widest font-semibold w-fit shadow-sm">
          Acesso Imediato
        </div>

        <h1 class="font-editorial text-3xl sm:text-4xl lg:text-5xl font-light text-textPrimary leading-[1.15]">
          Pronto para transformar sua leitura em <span class="text-accent italic">sabedoria duradoura</span>?
        </h1>

        <p class="font-interface text-sm sm:text-base text-textSecondary leading-relaxed">
          Junte-se a leitores, estudantes e pesquisadores que construíram seu segundo cérebro no Aresta. Crie sua conta gratuita em menos de 1 minuto ou acesse instantaneamente a demonstração.
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

        <!-- Alerta de Dica de Demonstração (Exibido na aba Login) -->
        <div v-if="authMode === 'login'" class="bg-accent/10 border border-accent/25 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-textPrimary">
          <KeyIcon class="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div class="flex flex-col gap-0.5">
            <span class="font-semibold text-accent uppercase tracking-wider text-[9px]">Acesso Rápido Demo</span>
            <span class="font-technical text-textSecondary text-[11px]">
              Login: <strong class="text-textPrimary">viktor</strong> · Senha: <strong class="text-textPrimary">orlaweb123123#</strong>
            </span>
          </div>
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
                placeholder="viktor"
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
  KeyIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircle2Icon
} from 'lucide-vue-next'
import ArestaLogoGraph from '~/components/ArestaLogoGraph.vue'
import { useAuth } from '~/composables/useAuth'
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
const { loadFromServer } = useSettings()

const authMode = ref<'login' | 'register'>('login')
const loginId = ref('viktor')
const password = ref('orlaweb123123#')

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
    await navigateTo(getRedirectUrl())
  } else {
    errorMessage.value = result.error || 'Falha ao criar conta. Verifique os dados informados.'
  }
}
</script>
