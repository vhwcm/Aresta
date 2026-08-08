<template>
  <div class="flex flex-col items-center justify-center min-h-[70vh] py-12">
    <div class="w-full max-w-md bg-white/5 border border-divider rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col gap-8">

      <!-- Header do Login -->
      <div class="flex flex-col items-center text-center gap-2">
        <div class="w-12 h-12 rounded-2xl bg-white/10 border border-divider flex items-center justify-center mb-2 shadow-inner">
          <ShieldCheckIcon class="w-6 h-6 text-accent" />
        </div>
        <h1 class="font-editorial text-3xl font-light text-textPrimary">
          Acessar o Aresta
        </h1>
        <p class="font-interface text-xs text-textSecondary max-w-xs">
          Informe suas credenciais para autenticar no sistema.
        </p>
      </div>

      <!-- Alerta de Dica de Credencial -->
      <div class="bg-accent/10 border border-accent/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-textPrimary">
        <KeyIcon class="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div class="flex flex-col gap-1">
          <span class="font-semibold text-accent uppercase tracking-wider text-[10px]">Credenciais do Administrador</span>
          <div class="font-technical text-textSecondary text-[11px] flex flex-col gap-0.5">
            <span><strong>Usuário / E-mail:</strong> viktor</span>
            <span><strong>Senha:</strong> orlaweb123123#</span>
          </div>
        </div>
      </div>

      <!-- Alerta de Erro -->
      <div v-if="errorMessage" class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 flex items-center gap-2">
        <AlertCircleIcon class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Formulário de Login -->
      <form @submit.prevent="handleLogin" class="flex flex-col gap-5">
        <div class="flex flex-col gap-1.5">
          <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
            Usuário ou E-mail
          </label>
          <div class="relative">
            <UserIcon class="w-4 h-4 text-textSecondary absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              v-model="loginId"
              type="text"
              required
              placeholder="viktor"
              class="w-full bg-black/40 border border-divider rounded-xl pl-11 pr-4 py-3 text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
            Senha
          </label>
          <div class="relative">
            <LockIcon class="w-4 h-4 text-textSecondary absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••••••"
              class="w-full bg-black/40 border border-divider rounded-xl pl-11 pr-4 py-3 text-sm text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-white text-black font-interface font-medium text-sm py-3.5 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer mt-2"
        >
          <span v-if="!isLoading">Entrar no Sistema</span>
          <span v-else class="flex items-center gap-2">
            <span class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            Autenticando...
          </span>
          <ArrowRightIcon v-if="!isLoading" class="w-4 h-4" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ShieldCheckIcon, KeyIcon, UserIcon, LockIcon, ArrowRightIcon, AlertCircleIcon } from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'

const route = typeof useRoute === 'function' ? useRoute() : { query: {} }
const auth = useAuth()

const loginId = ref('viktor')
const password = ref('orlaweb123123#')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  const result = await auth.login(loginId.value, password.value)
  isLoading.value = false

  if (result.success) {
    const redirectUrl = ((route.query as any).redirect as string) || '/users'
    navigateTo(redirectUrl)
  } else {
    errorMessage.value = result.error || 'Falha ao autenticar. Verifique o usuário e a senha.'
  }
}
</script>
