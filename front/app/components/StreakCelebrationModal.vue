<template>
  <Teleport to="body">
    <div
      v-if="isCelebrationOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      @click.self="closeCelebration"
    >
      <div
        class="relative w-full max-w-md p-8 rounded-3xl bg-[#121316] border border-accent/40 shadow-2xl flex flex-col items-center text-center overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      >
        <!-- Efeito de Brilho de Fundo -->
        <div
          class="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none transition-all duration-1000"
          :class="isFilledState ? 'opacity-100 scale-125 bg-amber-500/25' : 'opacity-30 scale-90'"
        ></div>

        <!-- Botão Fechar -->
        <button
          @click="closeCelebration"
          class="absolute top-4 right-4 p-2 rounded-full text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-colors"
          aria-label="Fechar"
        >
          <XIcon class="w-5 h-5" />
        </button>

        <!-- CONTAINER DA CHAMA ANIMADA (Duolingo Style: Outline -> Preenchido) -->
        <div class="relative my-4 flex items-center justify-center">
          <!-- Partículas de Fagulha ao redor -->
          <div
            v-if="isFilledState"
            class="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <span
              v-for="i in 8"
              :key="i"
              class="absolute w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75"
              :style="{
                transform: `rotate(${i * 45}deg) translateY(-54px)`,
                animationDelay: `${i * 120}ms`,
                animationDuration: '1.8s'
              }"
            ></span>
          </div>

          <!-- Ícone de Fogo com Transição -->
          <div
            class="w-32 h-32 rounded-3xl flex items-center justify-center transition-all duration-700 relative"
            :class="isFilledState ? 'scale-110 shadow-[0_0_50px_rgba(229,123,85,0.4)]' : 'scale-95'"
          >
            <svg
              viewBox="0 0 24 24"
              class="w-24 h-24 transition-all duration-700"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stop-color="#E57B55" />
                  <stop offset="50%" stop-color="#F59E0B" />
                  <stop offset="100%" stop-color="#FDE047" />
                </linearGradient>
              </defs>
              <path
                d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
                :fill="isFilledState ? 'url(#flameGrad)' : 'transparent'"
                :stroke="isFilledState ? '#F59E0B' : '#71717A'"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="transition-all duration-700"
                :class="{ 'animate-pulse': isFilledState }"
              />
            </svg>
          </div>
        </div>

        <!-- CONTADOR NUMÉRICO ANIMADO (N -> N+1) -->
        <div class="flex items-baseline gap-1 my-1">
          <span class="font-editorial text-6xl font-light text-accent transition-all duration-500">
            {{ displayStreak }}
          </span>
          <span class="font-interface text-xl text-textSecondary font-light">dias</span>
        </div>

        <!-- Mensagens Motivacionais -->
        <h3 class="font-editorial text-2xl font-light text-textPrimary mt-2">
          {{ celebrationData?.reachedMilestone ? 'Marco de Ofensiva Atingido! 🏆' : 'Ofensiva Mantida! 🔥' }}
        </h3>

        <p class="font-interface text-sm text-textSecondary mt-1.5 max-w-xs leading-relaxed">
          Você completou 10 minutos de leitura e revisou 5 flashcards hoje. Sua chama do conhecimento continua acesa!
        </p>

        <!-- Proposta de Nova Meta ao Bater o Marco -->
        <div
          v-if="celebrationData?.reachedMilestone && nextMilestone"
          class="w-full mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2 text-left"
        >
          <div class="flex items-center justify-between">
            <span class="font-interface text-xs text-amber-300 font-semibold flex items-center gap-1.5">
              <TrophyIcon class="w-3.5 h-3.5 text-amber-400" />
              Meta de {{ celebrationData.targetStreakDays }} dias superada!
            </span>
            <span class="font-technical text-[10px] text-amber-400 uppercase tracking-wider">Próximo Desafio</span>
          </div>
          <p class="font-interface text-xs text-textSecondary">
            Que tal buscar o próximo patamar de <strong>{{ nextMilestone }} dias</strong>?
          </p>
          <button
            @click="acceptNextMilestone(nextMilestone)"
            class="mt-1 w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-interface text-xs font-semibold transition-colors"
          >
            Aceitar Desafio de {{ nextMilestone }} Dias
          </button>
        </div>

        <!-- BOTÕES DE AÇÃO -->
        <div class="w-full flex flex-col gap-2.5 mt-6">
          <button
            @click="openShare"
            class="w-full py-3 px-6 rounded-2xl bg-accent hover:bg-accent/90 text-white font-interface text-sm font-medium transition-all shadow-lg hover:shadow-accent/20 flex items-center justify-center gap-2"
          >
            <Share2Icon class="w-4 h-4" />
            <span>Compartilhar Conquista</span>
          </button>

          <button
            @click="closeCelebration"
            class="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-textSecondary hover:text-textPrimary font-interface text-xs font-medium transition-colors"
          >
            Continuar Aprendendo
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XIcon, TrophyIcon, Share2Icon } from 'lucide-vue-next'
import { useStreakCelebration } from '~/composables/useStreakCelebration'
import { useReadingStreak } from '~/composables/useReadingStreak'

const { isCelebrationOpen, celebrationData, closeCelebration, openShare } = useStreakCelebration()
const { updateTargetStreakDays } = useReadingStreak()

const isFilledState = ref(false)
const displayStreak = ref(0)

const milestones = [7, 14, 30, 50, 100, 365]
const nextMilestone = computed(() => {
  if (!celebrationData.value) return null
  const current = celebrationData.value.currentStreak
  return milestones.find((m) => m > current) || current + 10
})

const acceptNextMilestone = async (target: number) => {
  await updateTargetStreakDays(target)
  closeCelebration()
}

watch(
  isCelebrationOpen,
  (open) => {
    if (open && celebrationData.value) {
      // Inicia como outline
      isFilledState.value = false
      displayStreak.value = celebrationData.value.previousStreak

      // Transição para preenchido e incremento numérico após 400ms
      setTimeout(() => {
        isFilledState.value = true
        displayStreak.value = celebrationData.value?.currentStreak || 1
      }, 450)
    }
  },
  { immediate: true }
)
</script>
