<template>
  <div
    v-if="isShareModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
  >
    <div class="relative w-full max-w-sm rounded-3xl bg-bgPanel border border-divider p-6 text-center shadow-2xl flex flex-col items-center gap-4">
      <h3 class="font-editorial text-2xl text-textPrimary">Compartilhar Ofensiva</h3>
      <div class="p-6 rounded-2xl bg-white/5 border border-accent/30 w-full flex flex-col items-center gap-2">
        <span class="text-4xl">🔥</span>
        <span class="font-technical text-3xl font-bold text-accent">{{ celebrationStreakDays }} Dias</span>
        <span class="font-interface text-xs text-textSecondary">Minha meta de leitura no Aresta</span>
      </div>

      <button
        @click="closeShareModal"
        class="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-textPrimary text-xs font-interface transition-colors"
      >
        Fechar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStreakCelebration } from '~/composables/useStreakCelebration'

const { isShareModalOpen, celebrationStreakDays, closeShareModal } = useStreakCelebration()
</script>
