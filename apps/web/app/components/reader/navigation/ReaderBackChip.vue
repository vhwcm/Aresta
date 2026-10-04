<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-3 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-2 scale-95"
  >
    <div
      v-if="showBackChip"
      class="reader-back-chip fixed bottom-20 left-1/2 -translate-x-1/2 z-40"
    >
      <div
        role="button"
        tabindex="0"
        class="inline-flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg border backdrop-blur-md text-xs font-technical font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer select-none"
        :class="{
          'bg-[#FAF5E8]/90 border-[#dfd5c0] text-[#2a2521] hover:border-accent': activeTheme === 'sepia',
          'bg-white/90 border-gray-200 text-gray-800 hover:border-accent': activeTheme === 'white',
          'bg-[#18181b]/90 border-white/15 text-white hover:border-accent': activeTheme === 'black',
        }"
        @click="goBack"
        @keydown.enter="goBack"
        title="Retornar à posição anterior antes do salto"
      >
        <ArrowLeftIcon class="w-3.5 h-3.5 text-accent" />
        <span>Voltar</span>
        <button
          type="button"
          class="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          @click.stop="dismissBackChip"
          aria-label="Dispensar botão voltar"
        >
          <XIcon class="w-3 h-3" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeftIcon, XIcon } from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'
import { useReadingNavigation } from '~/composables/reader/useReadingNavigation'

const store = useReaderStore()
const { showBackChip, goBack, dismissBackChip } = useReadingNavigation()

const activeTheme = computed(() => store.readerTheme || 'sepia')
</script>
