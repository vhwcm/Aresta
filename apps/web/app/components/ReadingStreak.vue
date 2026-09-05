<template>
  <div class="relative" ref="containerRef">
    <!-- Botão Trigger da Ofensiva -->
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-divider hover:border-accent/40 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-accent/40"
      :class="{ 'border-accent/50 bg-accent/10': isOpen }"
      title="Ofensiva de Leitura"
      aria-label="Ofensiva de Leitura"
    >
      <!-- Ícone Chama com preenchimento/brilho -->
      <div class="relative flex items-center justify-center">
        <FlameIcon
          class="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 group-hover:scale-110"
          :class="isGoalReachedToday ? 'text-accent fill-accent animate-pulse' : 'text-textSecondary'"
        />
      </div>

      <!-- Contador da Ofensiva -->
      <span class="font-technical text-xs sm:text-sm font-semibold text-textPrimary tracking-wider">
        {{ currentStreak }}
      </span>
    </button>

    <!-- Popover Flutuante com Estatísticas e Calendário Semanal -->
    <div
      v-if="isOpen"
      class="absolute right-0 top-full mt-3 w-84 sm:w-92 p-5 rounded-2xl bg-bgPanel/95 backdrop-blur-xl border border-divider shadow-2xl z-50 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Header do Popover -->
      <div class="flex items-center justify-between border-b border-divider pb-3">
        <div class="flex items-center gap-2.5">
          <div
            class="p-2 rounded-xl border transition-colors"
            :class="isGoalReachedToday ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-white/5 border-divider text-textSecondary'"
          >
            <FlameIcon class="w-5 h-5" :class="{ 'fill-accent': isGoalReachedToday }" />
          </div>
          <div>
            <h4 class="font-interface text-sm font-semibold text-textPrimary">Ofensiva de Leitura</h4>
            <p class="font-technical text-[10px] text-textSecondary uppercase tracking-wider">
              {{ isGoalReachedToday ? 'Meta de Hoje Concluída!' : 'Mantenha a Chama Acesa' }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <span class="font-editorial text-2xl font-light text-accent">{{ currentStreak }}</span>
          <span class="text-xs font-interface text-textSecondary block -mt-1">dias</span>
        </div>
      </div>

      <!-- Meta de Dias da Ofensiva (Milestone) -->
      <div class="flex flex-col gap-2 bg-white/[0.03] p-3.5 rounded-xl border border-divider/60">
        <div class="flex items-center justify-between text-xs font-interface">
          <span class="text-textSecondary flex items-center gap-1.5 font-medium">
            <TrophyIcon class="w-3.5 h-3.5 text-amber-400" />
            Meta de ofensiva:
          </span>
          <div class="flex items-center gap-1.5">
            <span class="font-technical text-textPrimary font-semibold">{{ currentStreak }}/{{ targetStreakDays }} dias</span>
            <button
              @click="isEditingTarget = !isEditingTarget"
              class="text-[10px] font-technical text-accent hover:underline px-1.5 py-0.5 rounded bg-accent/10"
              title="Alterar meta de dias"
            >
              {{ isEditingTarget ? 'Fechar' : 'Mudar' }}
            </button>
          </div>
        </div>

        <!-- Seletor de Metas em Dias -->
        <div v-if="isEditingTarget" class="grid grid-cols-6 gap-1 pt-2 border-t border-divider/40">
          <button
            v-for="target in [7, 14, 30, 50, 100, 365]"
            :key="target"
            @click="setTargetDays(target)"
            class="py-1 rounded-lg text-[11px] font-technical font-medium transition-all"
            :class="targetStreakDays === target ? 'bg-accent text-white font-bold' : 'bg-white/5 hover:bg-white/10 text-textSecondary'"
          >
            {{ target }}d
          </button>
        </div>

        <!-- Barra de Progresso em direção à Meta de Dias -->
        <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-amber-500 to-accent rounded-full transition-all duration-500"
            :style="{ width: `${Math.min(100, (currentStreak / (targetStreakDays || 1)) * 100)}%` }"
          ></div>
        </div>
      </div>

      <!-- Progresso de Hoje (10 min Leitura + 5 Flashcards) -->
      <div class="flex flex-col gap-3 bg-white/5 p-3.5 rounded-xl border border-divider/50">
        <span class="font-technical text-[10px] uppercase tracking-widest text-textSecondary font-semibold">
          Meta diária (Reset às 00:00 UTC)
        </span>

        <!-- Meta 1: Leitura (10 min) -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between text-xs font-interface">
            <span class="text-textSecondary flex items-center gap-1.5">
              <BookOpenIcon class="w-3.5 h-3.5" :class="todayActivity.isReadingCompleted ? 'text-emerald-400' : 'text-textSecondary'" />
              Tempo de Leitura:
            </span>
            <span class="font-technical text-textPrimary font-medium">
              {{ todayActivity.readingMinutes }} / 10 min
            </span>
          </div>
          <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              class="h-full bg-accent rounded-full transition-all duration-500"
              :style="{ width: `${Math.min(100, (todayActivity.readingSeconds / 600) * 100)}%` }"
            ></div>
          </div>
        </div>

        <!-- Meta 2: Flashcards (5 cards) -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between text-xs font-interface">
            <span class="text-textSecondary flex items-center gap-1.5">
              <LayersIcon class="w-3.5 h-3.5" :class="todayActivity.isFlashcardsCompleted ? 'text-emerald-400' : 'text-textSecondary'" />
              Flashcards Revisados:
            </span>
            <span class="font-technical text-textPrimary font-medium">
              {{ todayActivity.flashcardsReviewed }} / 5 cards
            </span>
          </div>
          <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              class="h-full bg-amber-500 rounded-full transition-all duration-500"
              :style="{ width: `${Math.min(100, (todayActivity.flashcardsReviewed / 5) * 100)}%` }"
            ></div>
          </div>
        </div>

        <!-- Status / Feedback -->
        <p v-if="isGoalReachedToday" class="font-interface text-[11px] text-emerald-400/90 flex items-center gap-1 mt-0.5 font-medium">
          <CheckCircle2Icon class="w-3.5 h-3.5 text-emerald-400" />
          Ofensiva de hoje mantida com sucesso!
        </p>
        <p v-else class="font-interface text-[11px] text-textSecondary mt-0.5">
          Faltam {{ Math.max(0, 10 - todayActivity.readingMinutes) }} min e {{ Math.max(0, 5 - todayActivity.flashcardsReviewed) }} cards para avançar.
        </p>
      </div>

      <!-- Congelamento de Ofensiva (Streak Freeze) -->
      <div class="flex items-center justify-between p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <ShieldIcon class="w-4 h-4" />
          </div>
          <div>
            <span class="font-interface text-textPrimary font-medium block">Congelamento de Ofensiva</span>
            <span class="font-technical text-[10px] text-textSecondary">+1 a cada 7 dias de ofensiva</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <div
            v-for="slot in 2"
            :key="slot"
            class="w-6 h-6 rounded-lg flex items-center justify-center border text-xs"
            :class="slot <= streakFreezeCount ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-white/5 border-white/10 text-textSecondary/40'"
            :title="slot <= streakFreezeCount ? 'Congelamento Ativo' : 'Slot Vazio'"
          >
            ❄️
          </div>
        </div>
      </div>

      <!-- Grade Semanal de Dias -->
      <div class="flex flex-col gap-1.5">
        <span class="font-technical text-[10px] uppercase tracking-widest text-textSecondary">Últimos 7 dias</span>
        <div class="grid grid-cols-7 gap-1.5 text-center">
          <div
            v-for="(day, index) in weeklyActivity"
            :key="index"
            class="flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-colors"
            :class="day.completed ? 'bg-accent/15 border-accent/30 text-accent' : day.frozen ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-divider text-textSecondary opacity-50'"
            :title="day.completed ? `${day.dayLabel}: Meta diária cumprida (${day.readingMinutes} min, ${day.flashcardsReviewed} cards)` : day.frozen ? `${day.dayLabel}: Dia protegido pelo congelamento` : `${day.dayLabel}: Incompleto`"
          >
            <span class="font-technical text-[10px] font-semibold">{{ day.dayLabel }}</span>
            <div
              class="w-2.5 h-2.5 rounded-full flex items-center justify-center text-[8px]"
              :class="day.completed ? 'bg-accent' : day.frozen ? 'bg-cyan-400' : 'bg-white/20'"
            ></div>
          </div>
        </div>
      </div>

      <!-- Rodapé: Recorde & Botão Compartilhar -->
      <div class="pt-2 border-t border-divider flex items-center justify-between text-xs text-textSecondary font-interface">
        <span>Maior sequência: <strong class="font-technical text-textPrimary">{{ longestStreak }} dias</strong></span>
        <button
          @click="handleShare"
          class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-divider text-textPrimary hover:text-accent font-interface text-xs transition-colors"
        >
          <Share2Icon class="w-3.5 h-3.5" />
          <span>Compartilhar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  FlameIcon,
  CheckCircle2Icon,
  BookOpenIcon,
  LayersIcon,
  TrophyIcon,
  ShieldIcon,
  Share2Icon
} from 'lucide-vue-next'
import { useReadingStreak } from '~/composables/useReadingStreak'
import { useStreakCelebration } from '~/composables/useStreakCelebration'

const {
  currentStreak,
  longestStreak,
  streakFreezeCount,
  targetStreakDays,
  todayActivity,
  weeklyActivity,
  isGoalReachedToday,
  updateTargetStreakDays
} = useReadingStreak()

const { openShareModal } = useStreakCelebration()

const isOpen = ref(false)
const isEditingTarget = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const setTargetDays = async (days: number) => {
  await updateTargetStreakDays(days)
  isEditingTarget.value = false
}

const handleShare = () => {
  isOpen.value = false
  openShareModal()
}

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
