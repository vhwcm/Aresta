<template>
  <div class="relative" ref="containerRef">
    <!-- Botão Trigger da Ofensiva -->
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-divider hover:border-accent/40 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-accent/40"
      :class="{ 'border-accent/50 bg-accent/10': isOpen }"
      title="Ofensiva de Leitura"
      aria-label="Ofensiva de Leitura"
    >
      <!-- Ícone Chama / Faísca sutil -->
      <div class="relative flex items-center justify-center">
        <FlameIcon
          class="w-4 h-4 text-accent transition-transform duration-300 group-hover:scale-110"
          :class="{ 'animate-pulse': isGoalReached }"
        />
      </div>

      <!-- Contador da Ofensiva (Número Puro) -->
      <span class="font-technical text-xs font-semibold text-textPrimary tracking-wider">
        {{ currentStreak }}
      </span>
    </button>

    <!-- Popover Flutuante com Estatísticas e Calendário Semanal -->
    <div
      v-if="isOpen"
      class="absolute right-0 top-full mt-3 w-72 p-4 rounded-2xl bg-[#141518]/95 backdrop-blur-xl border border-divider shadow-2xl z-50 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Header do Popover -->
      <div class="flex items-center justify-between border-b border-divider pb-3">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-accent/15 text-accent">
            <FlameIcon class="w-4 h-4" />
          </div>
          <div>
            <h4 class="font-interface text-sm font-medium text-textPrimary">Ofensiva de Leitura</h4>
            <p class="font-technical text-[10px] text-textSecondary uppercase tracking-wider">Hábito Diário Ativo</p>
          </div>
        </div>
        <span class="font-editorial text-2xl font-light text-accent">{{ currentStreak }} <span class="text-xs font-interface text-textSecondary">dias</span></span>
      </div>

      <!-- Progresso de Hoje -->
      <div class="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-divider/50">
        <div class="flex items-center justify-between text-xs font-interface">
          <span class="text-textSecondary">Meta diária:</span>
          <span class="font-technical text-textPrimary font-medium">{{ todayMinutesRead }} / {{ dailyGoalMinutes }} min</span>
        </div>
        <!-- Barra de Progresso -->
        <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            class="h-full bg-accent rounded-full transition-all duration-500"
            :style="{ width: `${Math.min(100, (todayMinutesRead / dailyGoalMinutes) * 100)}%` }"
          ></div>
        </div>
        <p v-if="isGoalReached" class="font-interface text-[11px] text-emerald-400/90 flex items-center gap-1 mt-0.5">
          <CheckCircle2Icon class="w-3 h-3" />
          Meta de hoje cumprida!
        </p>
        <p v-else class="font-interface text-[11px] text-textSecondary mt-0.5">
          Faltam {{ Math.max(0, dailyGoalMinutes - todayMinutesRead) }} min para atingir sua meta.
        </p>
      </div>

      <!-- Grade Semanal de Dias -->
      <div class="flex flex-col gap-1.5">
        <span class="font-technical text-[10px] uppercase tracking-widest text-textSecondary">Últimos 7 dias</span>
        <div class="grid grid-cols-7 gap-1.5 text-center">
          <div
            v-for="(day, index) in weeklyActivity"
            :key="index"
            class="flex flex-col items-center gap-1 p-1 rounded-lg border transition-colors"
            :class="day.completed ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-white/5 border-divider text-textSecondary opacity-50'"
            :title="`${day.dayLabel}: ${day.minutesRead} min lidos`"
          >
            <span class="font-technical text-[10px] font-semibold">{{ day.dayLabel }}</span>
            <div
              class="w-2 h-2 rounded-full"
              :class="day.completed ? 'bg-accent' : 'bg-white/20'"
            ></div>
          </div>
        </div>
      </div>

      <!-- Recorde -->
      <div class="pt-2 border-t border-divider flex items-center justify-between text-xs text-textSecondary font-interface">
        <span>Maior sequência histórica:</span>
        <span class="font-technical text-textPrimary font-semibold">{{ longestStreak }} dias</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { FlameIcon, CheckCircle2Icon } from 'lucide-vue-next'
import { useReadingStreak } from '~/composables/useReadingStreak'

const { currentStreak, longestStreak, dailyGoalMinutes, todayMinutesRead, isGoalReached, weeklyActivity } = useReadingStreak()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside)
  }
})
</script>
