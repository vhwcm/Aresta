<template>
  <div
    v-if="isCelebrationOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
  >
    <div class="relative w-full max-w-sm rounded-3xl bg-bgPanel border border-accent/40 p-6 text-center shadow-2xl flex flex-col items-center gap-4">
      <div class="w-16 h-16 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center text-3xl">
        🔥
      </div>

      <div class="flex flex-col gap-1">
        <h3 class="font-editorial text-2xl text-textPrimary">Ofensiva Mantida!</h3>
        <p class="font-interface text-xs text-textSecondary">
          Você completou sua meta diária e alcançou <span class="text-accent font-bold">{{ celebrationStreakDays }} dias</span> de sequência!
        </p>
      </div>

      <div class="w-full flex flex-col gap-2 pt-2">
        <button
          @click="openShare"
          class="w-full py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-medium font-interface transition-all shadow-lg shadow-accent/20"
        >
          Compartilhar Conquista
        </button>
        <button
          @click="closeCelebration"
          class="w-full py-2 rounded-xl text-textSecondary hover:text-textPrimary text-xs font-interface transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStreakCelebration } from '~/composables/useStreakCelebration'

const {
  isCelebrationOpen,
  celebrationStreakDays,
  closeCelebration,
  openShareModal
} = useStreakCelebration()

const openShare = () => {
  closeCelebration()
  openShareModal()
}
</script>
