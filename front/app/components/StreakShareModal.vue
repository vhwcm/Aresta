<template>
  <Teleport to="body">
    <div
      v-if="isShareModalOpen"
      class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300"
      @click.self="closeShare"
    >
      <div
        class="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#121316] border border-divider shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-divider pb-4">
          <div class="flex items-center gap-2">
            <Share2Icon class="w-5 h-5 text-accent" />
            <h3 class="font-interface text-base font-semibold text-textPrimary">Compartilhar Ofensiva</h3>
          </div>
          <button
            @click="closeShare"
            class="p-1.5 rounded-full text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-colors"
            aria-label="Fechar"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- CARD VISUAL ESTILIZADO (Estilo Duolingo / Aresta Share Card) -->
        <div
          ref="shareCardRef"
          class="relative w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#1c1d22] to-[#0d0e11] border border-accent/40 shadow-2xl overflow-hidden flex flex-col items-center text-center"
        >
          <!-- Brilho radial no topo -->
          <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/25 rounded-full blur-2xl pointer-events-none"></div>

          <!-- Topo do Card: Marca Aresta -->
          <div class="flex items-center gap-2 mb-4 z-10">
            <span class="font-editorial text-lg text-textPrimary tracking-wider font-light">ARESTA</span>
            <span class="w-1 h-1 rounded-full bg-accent"></span>
            <span class="font-technical text-[10px] text-textSecondary uppercase tracking-widest">Leitura & Retenção</span>
          </div>

          <!-- Fogo Central Dourado -->
          <div class="my-2 p-4 rounded-3xl bg-accent/15 border border-accent/30 shadow-[0_0_30px_rgba(229,123,85,0.3)] flex items-center justify-center z-10">
            <FlameIcon class="w-12 h-12 text-accent fill-accent" />
          </div>

          <!-- Contagem de Dias -->
          <div class="z-10 mt-2">
            <span class="font-editorial text-5xl sm:text-6xl font-light text-textPrimary block">
              {{ currentStreak }}
            </span>
            <span class="font-technical text-xs font-semibold uppercase tracking-widest text-accent">
              Dias de Ofensiva
            </span>
          </div>

          <!-- Frase de Impacto -->
          <p class="font-interface text-xs text-textSecondary mt-3 max-w-xs leading-relaxed z-10">
            "Construindo meu grafo de conhecimento e dominando conceitos todos os dias no Aresta."
          </p>

          <!-- Badges de Hoje -->
          <div class="flex items-center gap-2 mt-5 z-10">
            <span class="px-3 py-1 rounded-full bg-white/5 border border-divider font-technical text-[10px] text-textPrimary flex items-center gap-1.5">
              <BookOpenIcon class="w-3 h-3 text-accent" />
              10 min de leitura
            </span>
            <span class="px-3 py-1 rounded-full bg-white/5 border border-divider font-technical text-[10px] text-textPrimary flex items-center gap-1.5">
              <LayersIcon class="w-3 h-3 text-amber-400" />
              5 flashcards revisados
            </span>
          </div>
        </div>

        <!-- AÇÕES DE COMPARTILHAMENTO -->
        <div class="flex flex-col gap-3">
          <span class="font-technical text-[10px] uppercase tracking-widest text-textSecondary">
            Escolha como compartilhar:
          </span>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <!-- 1. WhatsApp -->
            <button
              @click="shareToWhatsApp"
              class="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-interface text-xs font-medium transition-all"
            >
              <MessageCircleIcon class="w-5 h-5" />
              <span>WhatsApp</span>
            </button>

            <!-- 2. Instagram Stories / Download PNG -->
            <button
              @click="downloadCardAsImage"
              class="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-purple-500/10 hover:from-amber-500/20 hover:to-purple-500/20 border border-rose-500/30 text-rose-300 font-interface text-xs font-medium transition-all"
            >
              <InstagramIcon class="w-5 h-5" />
              <span>Instagram (PNG)</span>
            </button>

            <!-- 3. LinkedIn -->
            <button
              @click="shareToLinkedIn"
              class="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/30 text-[#70B5F9] font-interface text-xs font-medium transition-all"
            >
              <LinkedinIcon class="w-5 h-5" />
              <span>LinkedIn</span>
            </button>

            <!-- 4. Web Share API Nativo (Mobile) ou Copiar Link -->
            <button
              @click="shareNativeOrCopy"
              class="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-divider text-textPrimary font-interface text-xs font-medium transition-all"
            >
              <CopyIcon v-if="copied" class="w-5 h-5 text-emerald-400" />
              <ShareIcon v-else class="w-5 h-5 text-textSecondary" />
              <span>{{ copied ? 'Copiado!' : 'Copiar Texto' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Share2Icon,
  XIcon,
  FlameIcon,
  BookOpenIcon,
  LayersIcon,
  MessageCircleIcon,
  InstagramIcon,
  LinkedinIcon,
  ShareIcon,
  CopyIcon
} from 'lucide-vue-next'
import { useStreakCelebration } from '~/composables/useStreakCelebration'
import { useReadingStreak } from '~/composables/useReadingStreak'

const { isShareModalOpen, closeShare } = useStreakCelebration()
const { currentStreak } = useReadingStreak()

const copied = ref(false)
const shareCardRef = ref<HTMLElement | null>(null)

const getShareText = () => {
  return `🔥 Acabei de atingir uma ofensiva de ${currentStreak.value} dias no Aresta! Leitura diária e revisão de flashcards com grafos de conhecimento.`
}

const shareToWhatsApp = () => {
  const text = encodeURIComponent(`${getShareText()}\nhttps://aresta.org`)
  if (typeof window !== 'undefined') {
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }
}

const shareToLinkedIn = () => {
  const url = encodeURIComponent('https://aresta.org')
  if (typeof window !== 'undefined') {
    navigator.clipboard?.writeText(getShareText())
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank')
  }
}

const shareNativeOrCopy = async () => {
  const text = getShareText()
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'Minha Ofensiva no Aresta',
        text: text,
        url: 'https://aresta.org'
      })
      return
    } catch {
      // Ignora cancelamento do usuário no sheet nativo
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(`${text}\nhttps://aresta.org`)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2500)
  }
}

const downloadCardAsImage = () => {
  if (typeof document === 'undefined') return

  // Renderização em Canvas nativo para gerar imagem PNG de alta fidelidade
  const canvas = document.createElement('canvas')
  const width = 1080
  const height = 1080
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Fundo com gradiente radial
  const bgGrad = ctx.createRadialGradient(width / 2, 300, 50, width / 2, height / 2, 700)
  bgGrad.addColorStop(0, '#241a15')
  bgGrad.addColorStop(0.5, '#121316')
  bgGrad.addColorStop(1, '#0a0a0c')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // Borda elegante
  ctx.strokeStyle = 'rgba(229, 123, 85, 0.4)'
  ctx.lineWidth = 6
  ctx.strokeRect(30, 30, width - 60, height - 60)

  // Header ARESTA
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '300 42px "Playfair Display", Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('ARESTA', width / 2, 160)

  ctx.fillStyle = '#E57B55'
  ctx.font = '600 20px monospace'
  ctx.fillText('LEITURA & RETENÇÃO DE CONHECIMENTO', width / 2, 210)

  // Círculo com Brilho para Chama
  const glowGrad = ctx.createRadialGradient(width / 2, 430, 20, width / 2, 430, 160)
  glowGrad.addColorStop(0, 'rgba(229, 123, 85, 0.35)')
  glowGrad.addColorStop(1, 'rgba(229, 123, 85, 0)')
  ctx.fillStyle = glowGrad
  ctx.beginPath()
  ctx.arc(width / 2, 430, 160, 0, Math.PI * 2)
  ctx.fill()

  // Ícone de Fogo
  ctx.font = '100px sans-serif'
  ctx.fillText('🔥', width / 2, 460)

  // Número da Ofensiva
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '300 130px "Playfair Display", Georgia, serif'
  ctx.fillText(String(currentStreak.value), width / 2, 630)

  ctx.fillStyle = '#E57B55'
  ctx.font = '700 28px monospace'
  ctx.fillText('DIAS DE OFENSIVA', width / 2, 690)

  // Frase
  ctx.fillStyle = '#A1A1AA'
  ctx.font = '400 26px sans-serif'
  ctx.fillText('Construindo meu grafo de conhecimento todos os dias.', width / 2, 770)

  // Rodapé com Badges
  ctx.fillStyle = '#1e2026'
  ctx.fillRect(width / 2 - 380, 840, 760, 80)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 2
  ctx.strokeRect(width / 2 - 380, 840, 760, 80)

  ctx.fillStyle = '#F4F4F5'
  ctx.font = '600 22px monospace'
  ctx.fillText('📖 10 MIN LEITURA   •   🗂️ 5 FLASHCARDS HOJE', width / 2, 888)

  // Download do arquivo PNG
  const link = document.createElement('a')
  link.download = `aresta-ofensiva-${currentStreak.value}-dias.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
</script>
