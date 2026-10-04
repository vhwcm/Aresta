<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goto-dialog-title"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        @click="$emit('close')"
      />

      <!-- Card do Diálogo -->
      <div
        class="relative w-full max-w-sm rounded-2xl p-5 shadow-2xl border z-10 space-y-4"
        :class="{
          'bg-[#FAF5E8] border-[#dfd5c0] text-[#2a2521]': activeTheme === 'sepia',
          'bg-white border-gray-200 text-gray-900': activeTheme === 'white',
          'bg-[#121214] border-white/10 text-white': activeTheme === 'black',
        }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <CompassIcon class="w-4 h-4 text-accent" />
            <h3 id="goto-dialog-title" class="text-sm font-bold font-interface">
              Ir para...
            </h3>
          </div>
          <button
            type="button"
            class="p-1 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            @click="$emit('close')"
            aria-label="Fechar"
          >
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-3">
          <div class="relative">
            <input
              ref="inputRef"
              v-model="inputValue"
              type="text"
              :placeholder="isEpub ? 'Ex: 42, 35% ou Loc 1200' : 'Ex: 42 ou 35%'"
              class="w-full px-3.5 py-2.5 rounded-xl border text-sm font-technical focus:outline-hidden focus:border-accent transition-all"
              :class="{
                'bg-black/5 border-[#dfd5c0] text-[#2a2521]': activeTheme === 'sepia',
                'bg-gray-50 border-gray-200 text-gray-900': activeTheme === 'white',
                'bg-white/5 border-white/10 text-white': activeTheme === 'black',
                'border-red-500': hasError,
              }"
              @input="hasError = false"
            />
            <button
              v-if="inputValue"
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary"
              @click="inputValue = ''"
            >
              <XIcon class="w-3.5 h-3.5" />
            </button>
          </div>

          <p v-if="hasError" class="text-xs text-red-500 font-interface">
            Entrada inválida. Digite uma página, % ou localização válida (ex: 42, 35%, Loc 1200).
          </p>

          <p v-else class="text-[11px] text-textSecondary font-interface">
            Total disponível: {{ isEpub ? `Loc. 1 a ${totalUnits.toLocaleString('pt-BR')}` : `Pág. 1 a ${totalUnits.toLocaleString('pt-BR')}` }}.
          </p>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl text-xs font-interface hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              @click="$emit('close')"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent/90 transition-colors shadow-xs cursor-pointer"
            >
              Navegar
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { CompassIcon, XIcon } from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'
import { useLocationProgress } from '~/composables/reader/useLocationProgress'
import { useReadingNavigation } from '~/composables/reader/useReadingNavigation'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (_e: 'close'): void
}>()

const store = useReaderStore()
const { totalUnits, isEpub } = useLocationProgress()
const { parseGoToInput, goToPosition } = useReadingNavigation()

const activeTheme = computed(() => store.readerTheme || 'sepia')
const inputValue = ref('')
const hasError = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      inputValue.value = ''
      hasError.value = false
      await nextTick()
      inputRef.value?.focus()
    }
  }
)

function handleSubmit() {
  if (!inputValue.value.trim()) return
  const pos = parseGoToInput(inputValue.value)
  if (!pos) {
    hasError.value = true
    return
  }
  goToPosition(pos)
  emit('close')
}
</script>
