<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-hidden"
      data-testid="feedback-canvas-container"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-canvas-title"
      @keydown.esc="close"
    >
      <!-- Backdrop escurecido e desfocado com clique para fechar -->
      <div
        data-testid="feedback-canvas-backdrop"
        class="fixed inset-0 bg-black/60 backdrop-blur-[4px] transition-opacity animate-in fade-in duration-300 cursor-pointer"
        @click="close"
      />

      <!-- Drawer Lateral / Canvas Deslizante -->
      <aside
        data-testid="feedback-canvas-drawer"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-bgPanel border-l border-divider shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
      >
        <!-- Cabeçalho -->
        <header class="p-6 border-b border-divider flex items-start justify-between shrink-0 bg-white/[0.02]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shrink-0 shadow-inner">
              <MessageSquareHeartIcon class="w-5 h-5" />
            </div>
            <div class="flex flex-col">
              <div class="font-technical text-[10px] uppercase tracking-widest text-accent font-semibold flex items-center gap-1.5">
                <SparklesIcon class="w-3 h-3" />
                <span>Canal Direto</span>
              </div>
              <h2 id="feedback-canvas-title" data-testid="feedback-canvas-title" class="font-editorial text-2xl font-light text-textPrimary leading-tight mt-0.5">
                Feedback & Melhorias
              </h2>
            </div>
          </div>

          <button
            data-testid="feedback-canvas-close-btn"
            type="button"
            class="p-2 rounded-full bg-white/5 border border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
            title="Fechar (Esc)"
            aria-label="Fechar painel de feedback"
            @click="close"
          >
            <XIcon class="w-4 h-4" />
          </button>
        </header>

        <!-- Corpo do Canvas com Scroll Interno -->
        <div class="p-6 flex-1 overflow-y-auto flex flex-col gap-6 font-interface">
          <!-- Introdução amigável -->
          <p class="text-sm text-textSecondary leading-relaxed font-light">
            Sua percepção molda o futuro do Aresta. Compartilhe uma ideia de funcionalidade, uma sugestão de usabilidade ou nos conte o que achou da experiência.
          </p>

          <!-- Banner do Usuário -->
          <div
            data-testid="feedback-user-banner"
            class="p-3.5 rounded-xl border border-divider bg-white/[0.02] flex items-center justify-between text-xs"
          >
            <div class="flex items-center gap-2.5 truncate">
              <div class="w-7 h-7 rounded-full bg-accent/20 text-accent font-technical font-semibold flex items-center justify-center shrink-0 text-[11px]">
                {{ userInitials }}
              </div>
              <div class="flex flex-col truncate">
                <span class="text-textPrimary font-medium truncate">{{ userName }}</span>
                <span class="text-textSecondary text-[11px] truncate">{{ userEmail }}</span>
              </div>
            </div>

          </div>

          <!-- Seleção de Categoria / Tipo -->
          <div class="flex flex-col gap-2">
            <label class="font-technical text-xs text-textSecondary uppercase tracking-wider">
              Tipo de Mensagem
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                data-testid="feedback-type-improvement"
                class="px-3 py-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer text-center"
                :class="category === 'IMPROVEMENT'
                  ? ['bg-accent/15', 'border-accent', 'text-accent', 'shadow-sm']
                  : ['bg-white/[0.02]', 'border-divider', 'text-textSecondary', 'hover:bg-white/[0.05]', 'hover:text-textPrimary']"
                @click="category = 'IMPROVEMENT'"
              >
                <LightbulbIcon class="w-4 h-4" />
                <span>Melhoria</span>
              </button>

              <button
                type="button"
                data-testid="feedback-type-feedback"
                class="px-3 py-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer text-center"
                :class="category === 'FEEDBACK'
                  ? ['bg-accent/15', 'border-accent', 'text-accent', 'shadow-sm']
                  : ['bg-white/[0.02]', 'border-divider', 'text-textSecondary', 'hover:bg-white/[0.05]', 'hover:text-textPrimary']"
                @click="category = 'FEEDBACK'"
              >
                <MessageSquareIcon class="w-4 h-4" />
                <span>Feedback</span>
              </button>

              <button
                type="button"
                data-testid="feedback-type-bug"
                class="px-3 py-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer text-center"
                :class="category === 'BUG'
                  ? ['bg-accent/15', 'border-accent', 'text-accent', 'shadow-sm']
                  : ['bg-white/[0.02]', 'border-divider', 'text-textSecondary', 'hover:bg-white/[0.05]', 'hover:text-textPrimary']"
                @click="category = 'BUG'"
              >
                <BugIcon class="w-4 h-4" />
                <span>Problema</span>
              </button>
            </div>
          </div>

          <!-- Mensagem / Textarea -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <label for="feedback-message-input" class="font-technical text-xs text-textSecondary uppercase tracking-wider">
                Sua Mensagem
              </label>
              <span
                class="font-technical text-[11px]"
                :class="message.length > 1800 ? 'text-amber-500 font-semibold' : 'text-textSecondary/70'"
              >
                {{ message.length }}/2000
              </span>
            </div>

            <textarea
              id="feedback-message-input"
              v-model="message"
              data-testid="feedback-message-textarea"
              rows="6"
              maxlength="2000"
              placeholder="Descreva em detalhes sua ideia, o que mais gostou no Aresta ou o que podemos aprimorar..."
              class="w-full p-4 rounded-2xl bg-white/[0.03] border border-divider text-textPrimary placeholder:text-textSecondary/50 text-sm leading-relaxed focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40 transition-all resize-none"
              :disabled="isSubmitting || isSuccess"
            />
          </div>

          <!-- Alerta de Erro se houver -->
          <div
            v-if="errorMessage"
            data-testid="feedback-error-banner"
            class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertCircleIcon class="w-4 h-4 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Estado de Sucesso -->
          <div
            v-if="isSuccess"
            data-testid="feedback-success-banner"
            class="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex flex-col items-center text-center gap-3 animate-in zoom-in-95 duration-300"
          >
            <div class="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircleIcon class="w-6 h-6" />
            </div>
            <div class="flex flex-col gap-1">
              <h4 class="font-editorial text-lg text-emerald-200">Mensagem Enviada!</h4>
              <p class="text-xs text-emerald-300/80 leading-relaxed max-w-xs">
                Obrigado por contribuir com a evolução do ecossistema Aresta. Nossa equipe revisará sua mensagem com carinho.
              </p>
            </div>
            <button
              type="button"
              class="mt-1 px-4 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-medium text-emerald-200 transition-all cursor-pointer active:scale-95"
              @click="resetForm"
            >
              Enviar outra mensagem
            </button>
          </div>
        </div>

        <!-- Rodapé com Botões de Ação -->
        <footer class="p-6 border-t border-divider flex items-center justify-end gap-3 bg-white/[0.01]">
          <button
            type="button"
            data-testid="feedback-cancel-btn"
            class="px-4 py-2.5 rounded-xl border border-divider text-textSecondary hover:text-textPrimary hover:bg-white/5 text-xs font-medium transition-all cursor-pointer active:scale-95"
            @click="close"
          >
            {{ isSuccess ? 'Fechar' : 'Cancelar' }}
          </button>

          <button
            v-if="!isSuccess"
            type="button"
            data-testid="feedback-submit-btn"
            class="px-5 py-2.5 rounded-xl bg-accent hover:bg-primaryHover text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            :disabled="!canSubmit || isSubmitting"
            @click="handleSubmit"
          >
            <Loader2Icon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <SendIcon v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Enviando...' : 'Enviar Mensagem' }}</span>
          </button>
        </footer>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  XIcon,
  MessageSquareHeartIcon,
  MessageSquareIcon,
  SparklesIcon,
  LightbulbIcon,
  BugIcon,
  SendIcon,
  Loader2Icon,
  CheckCircleIcon,
  AlertCircleIcon
} from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'
import { getApiRoot } from '~/utils/apiBase'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'close'): void
  (e: 'submitted', feedback: any): void
}>()

const auth = useAuth()

const category = ref<'FEEDBACK' | 'IMPROVEMENT' | 'BUG'>('IMPROVEMENT')
const message = ref('')
const isSubmitting = ref(false)
const isSuccess = ref(false)
const errorMessage = ref('')

const userName = computed(() => {
  return auth.user.value?.name || 'Leitor Aresta'
})

const userEmail = computed(() => {
  return auth.user.value?.email || 'autenticado'
})

const userInitials = computed(() => {
  const name = userName.value.trim()
  if (!name) return 'A'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const canSubmit = computed(() => {
  return message.value.trim().length >= 3 && !isSubmitting.value
})

const close = () => {
  emit('update:isOpen', false)
  emit('close')
}

const resetForm = () => {
  message.value = ''
  category.value = 'IMPROVEMENT'
  isSuccess.value = false
  errorMessage.value = ''
}

const getApiBase = () => {
  return getApiRoot()
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const apiBase = getApiBase()
    const token = auth.token?.value

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await $fetch<{ feedback: any }>(`${apiBase}/api/feedback`, {
      method: 'POST',
      headers,
      body: {
        message: message.value.trim(),
        type: category.value
      }
    })

    isSuccess.value = true
    emit('submitted', res.feedback)
  } catch (err: any) {
    console.error('[FeedbackCanvas] Erro ao enviar:', err)
    errorMessage.value = err?.data?.error || err?.message || 'Não foi possível enviar sua mensagem no momento. Tente novamente.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
