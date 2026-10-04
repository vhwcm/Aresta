<template>
  <Teleport to="body">
    <Transition name="aresta-dialog-fade">
      <div
        v-if="state.isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4"
        @click.self="handleCancel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div
          class="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-bgPanel border shadow-2xl flex flex-col gap-5 text-textPrimary relative animate-in zoom-in-95 duration-200"
          :class="borderClass"
        >
          <!-- Top Bar: Logo & Status Badge + Close button -->
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <!-- Logo Aresta Oficial -->
              <div v-if="state.showLogo" class="shrink-0">
                <ArestaLogoGraph :size="32" :to="null" />
              </div>

              <!-- Badge / Ícone do tipo -->
              <div
                class="p-2 rounded-xl flex items-center justify-center shrink-0 border"
                :class="iconContainerClass"
              >
                <Trash2Icon v-if="state.icon === 'delete'" class="w-4 h-4 text-rose-400" />
                <LogOutIcon v-else-if="state.icon === 'logout'" class="w-4 h-4 text-rose-400" />
                <AlertTriangleIcon v-else-if="state.variant === 'danger' || state.variant === 'warning'" class="w-4 h-4" />
                <CheckCircle2Icon v-else-if="state.variant === 'success'" class="w-4 h-4 text-emerald-400" />
                <InfoIcon v-else class="w-4 h-4 text-accent" />
              </div>
            </div>

            <!-- Botão Fechar -->
            <button
              type="button"
              @click="handleCancel"
              class="p-1.5 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-colors"
              aria-label="Fechar"
            >
              <XIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Título e Subtítulo -->
          <div>
            <span
              v-if="state.subtitle"
              class="font-technical text-[10px] uppercase tracking-wider block mb-1"
              :class="state.variant === 'danger' ? 'text-rose-400' : 'text-textSecondary'"
            >
              {{ state.subtitle }}
            </span>
            <h3 :id="titleId" class="font-editorial text-2xl text-textPrimary leading-tight">
              {{ state.title }}
            </h3>
          </div>

          <!-- Mensagem / Descrição -->
          <div class="space-y-2">
            <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed whitespace-pre-line">
              {{ state.message }}
            </p>
          </div>

          <!-- Ações do Rodapé -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-divider">
            <button
              v-if="state.showCancel"
              type="button"
              @click="handleCancel"
              class="px-4 py-2.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-all font-interface"
              data-testid="aresta-dialog-cancel-btn"
            >
              {{ state.cancelText }}
            </button>

            <button
              type="button"
              ref="confirmBtnRef"
              @click="handleConfirm"
              class="px-5 py-2.5 rounded-xl text-white font-interface text-xs font-semibold shadow-lg transition-all flex items-center gap-2 active:scale-95"
              :class="confirmBtnClass"
              data-testid="aresta-dialog-confirm-btn"
            >
              <Trash2Icon v-if="state.icon === 'delete'" class="w-3.5 h-3.5" />
              <LogOutIcon v-else-if="state.icon === 'logout'" class="w-3.5 h-3.5" />
              <span>{{ state.confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  AlertTriangleIcon,
  InfoIcon,
  CheckCircle2Icon,
  Trash2Icon,
  LogOutIcon,
  XIcon
} from 'lucide-vue-next'
import ArestaLogoGraph from '~/components/ArestaLogoGraph.vue'
import { useArestaDialog } from '~/composables/useArestaDialog'

const { state, handleConfirm, handleCancel } = useArestaDialog()

const titleId = computed(() => 'aresta-dialog-title-' + Math.random().toString(36).substring(2, 9))
const confirmBtnRef = ref<HTMLButtonElement | null>(null)

const borderClass = computed(() => {
  switch (state.value.variant) {
    case 'danger':
      return 'border-rose-500/40 shadow-rose-950/20'
    case 'warning':
      return 'border-amber-500/40 shadow-amber-950/20'
    case 'success':
      return 'border-emerald-500/40 shadow-emerald-950/20'
    default:
      return 'border-divider shadow-black/40'
  }
})

const iconContainerClass = computed(() => {
  switch (state.value.variant) {
    case 'danger':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    case 'warning':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'success':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    default:
      return 'bg-accent/15 text-accent border-accent/30'
  }
})

const confirmBtnClass = computed(() => {
  switch (state.value.variant) {
    case 'danger':
      return 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40 text-white'
    case 'warning':
      return 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40 text-white'
    case 'success':
      return 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40 text-white'
    default:
      return 'bg-accent hover:bg-accent/90 shadow-accent/30 text-white'
  }
})

const handleKeyDown = (e: KeyboardEvent) => {
  if (!state.value.isOpen) return
  if (e.key === 'Escape') {
    e.preventDefault()
    handleCancel()
  }
}

watch(
  () => state.value.isOpen,
  (open) => {
    if (open) {
      void nextTick(() => {
        confirmBtnRef.value?.focus()
      })
    }
  }
)

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.aresta-dialog-fade-enter-active,
.aresta-dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.aresta-dialog-fade-enter-from,
.aresta-dialog-fade-leave-to {
  opacity: 0;
}
</style>
