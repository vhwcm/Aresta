<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    @click.self="handleCancel"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
  >
    <div
      class="max-w-md w-full p-6 md:p-8 rounded-3xl bg-bgPanel border border-rose-500/30 shadow-2xl flex flex-col gap-6 text-textPrimary animate-in zoom-in-95 duration-200"
      :class="variant === 'danger' ? 'border-rose-500/40' : 'border-divider'"
    >
      <!-- Cabeçalho -->
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div
            class="p-2.5 rounded-2xl flex items-center justify-center shrink-0"
            :class="variant === 'danger' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-accent/15 text-accent border border-accent/30'"
          >
            <AlertTriangleIcon v-if="variant === 'danger'" class="w-5 h-5" />
            <InfoIcon v-else class="w-5 h-5" />
          </div>
          <div>
            <h3 :id="titleId" class="font-editorial text-2xl text-textPrimary leading-tight">
              {{ title }}
            </h3>
            <span v-if="subtitle" class="font-technical text-[10px] uppercase tracking-wider text-rose-400">
              {{ subtitle }}
            </span>
          </div>
        </div>
        <button
          @click="handleCancel"
          class="p-1.5 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-colors"
          aria-label="Fechar modal"
        >
          <XIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Descrição / Conteúdo -->
      <div class="space-y-3">
        <p class="font-interface text-xs md:text-sm text-textSecondary leading-relaxed">
          {{ description }}
        </p>
        <slot name="extra" />
      </div>

      <!-- Rodapé de Ações -->
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-divider">
        <button
          @click="handleCancel"
          :disabled="loading"
          class="px-4 py-2.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary hover:bg-white/5 disabled:opacity-50 transition-all font-interface"
          data-testid="confirm-modal-cancel-btn"
        >
          {{ cancelText }}
        </button>

        <button
          @click="handleConfirm"
          :disabled="loading"
          class="px-5 py-2.5 rounded-xl text-white font-interface text-xs font-semibold shadow-lg transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          :class="variant === 'danger'
            ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40 text-white'
            : 'bg-accent hover:bg-accent/90 shadow-accent/30 text-white'"
          data-testid="confirm-modal-confirm-btn"
        >
          <span v-if="loading" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <slot name="confirm-icon">
            <LogOutIcon v-if="actionType === 'logout'" class="w-3.5 h-3.5" />
            <Trash2Icon v-else-if="actionType === 'delete'" class="w-3.5 h-3.5" />
          </slot>
          <span>{{ confirmText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangleIcon, InfoIcon, XIcon, LogOutIcon, Trash2Icon } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    title: string
    description: string
    subtitle?: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'primary'
    actionType?: 'logout' | 'delete' | 'default'
    loading?: boolean
  }>(),
  {
    subtitle: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'danger',
    actionType: 'default',
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const titleId = computed(() => 'modal-title-' + Math.random().toString(36).substring(2, 9))

const handleConfirm = () => {
  if (!props.loading) {
    emit('confirm')
  }
}

const handleCancel = () => {
  if (!props.loading) {
    emit('cancel')
  }
}
</script>
