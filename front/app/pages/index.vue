<template>
  <div class="flex flex-col gap-10 pb-20 animate-in fade-in duration-500">
    <!-- Top Bar Integrada da Home (Visível apenas no Desktop com Busca Cmd+K e Ofensiva) -->
    <div class="hidden md:flex items-center justify-between gap-4">
      <!-- Barra de Busca Cmd+K Integrada (Visível APENAS para Desktop) -->
      <div
        class="flex-1 max-w-md items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-divider hover:border-white/20 transition-all cursor-pointer group text-textSecondary flex"
        @click="commandPalette.open()"
        role="button"
        tabindex="0"
        aria-label="Abrir paleta de comandos"
      >
        <SearchIcon class="w-4 h-4 group-hover:text-textPrimary transition-colors" />
        <span class="text-xs font-interface font-normal truncate group-hover:text-textPrimary transition-colors">
          Explorar livros, conceitos ou comandos...
        </span>
        <div class="ml-auto flex items-center gap-1 font-technical text-[10px] uppercase font-semibold tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
          <span>Cmd</span>
          <span>K</span>
        </div>
      </div>

      <!-- Canto Superior Direito: Ofensiva em Dias no Desktop -->
      <div class="flex items-center gap-2 ml-auto">
        <ReadingStreak />
      </div>
    </div>

    <!-- BLOCO 1: ÚLTIMA LEITURA ATIVA (Clean, sem caixa, capa clicável e conversor em ícone) -->
    <section class="flex flex-row items-center sm:items-start gap-5 sm:gap-8">
      <!-- Capa do Livro (Clicável diretamente no mobile e desktop) -->
      <NuxtLink
        :to="activeBookReaderLink"
        class="relative shrink-0 group/cover cursor-pointer select-none"
        :title="`Continuar leitura de ${activeBookTitle}`"
      >
        <div class="w-24 sm:w-32 md:w-36 aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border border-divider hover:border-accent/50 bg-neutral-900 flex items-center justify-center relative transition-all duration-300 group-hover/cover:scale-[1.02]">
          <img
            v-if="activeBookCoverUrl && !coverError"
            :src="activeBookCoverUrl"
            :alt="activeBookTitle"
            @error="coverError = true"
            class="w-full h-full object-cover"
          />
          <!-- Fallback se imagem falhar -->
          <div v-else class="w-full h-full p-3 flex flex-col justify-between bg-gradient-to-br from-neutral-800 to-neutral-950 text-left border-l-2 border-accent">
            <span class="font-technical text-[8px] uppercase tracking-wider text-accent font-semibold">Aresta</span>
            <span class="font-editorial text-xs sm:text-sm font-light text-white leading-tight line-clamp-3">{{ activeBookTitle }}</span>
            <span class="font-interface text-[9px] text-textSecondary">Machado de Assis</span>
          </div>

          <!-- Efeito de Lombada de Livro -->
          <div class="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/60 via-white/10 to-transparent pointer-events-none"></div>
        </div>
      </NuxtLink>

      <!-- Informações Compactas do Livro -->
      <div class="flex flex-col justify-between gap-3 flex-1 min-w-0">
        <div class="flex flex-col gap-1">
          <div class="flex items-start justify-between gap-2">
            <NuxtLink :to="activeBookReaderLink" class="hover:text-accent transition-colors flex-1 min-w-0">
              <h1 class="font-editorial text-2xl sm:text-4xl md:text-5xl font-light text-textPrimary leading-tight truncate sm:whitespace-normal">
                {{ activeBookTitle }}
              </h1>
            </NuxtLink>

            <!-- Ofensiva no Mobile (Ao lado do livro para enxugar espaço) -->
            <div class="md:hidden shrink-0">
              <ReadingStreak />
            </div>
          </div>

          <!-- Progresso Resumido (Tanto de Tanto) -->
          <div class="text-xs sm:text-sm font-technical text-textSecondary flex items-center gap-2">
            <span>Pág. {{ activeBookCurrentPage }} / {{ activeBookTotalPages }}</span>
            <span>·</span>
            <span class="text-accent font-medium">{{ activeBookProgress }}%</span>
          </div>
        </div>

        <!-- Botões de Ação Compactos (Seta para leitura e Ícone para Conversor) -->
        <div class="flex items-center gap-3 pt-1">
          <NuxtLink
            :to="activeBookReaderLink"
            class="bg-white text-black font-interface text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-gray-200 transition-all flex items-center gap-1.5 shadow-md"
            title="Continuar Leitura"
          >
            <span class="hidden sm:inline">Continuar</span>
            <ArrowRightIcon class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </NuxtLink>

          <!-- Conversor: Sempre em formato de Ícone -->
          <NuxtLink
            to="/conversor"
            class="p-2 sm:p-2.5 rounded-full border border-divider bg-white/5 hover:bg-white/10 hover:border-accent/40 text-accent hover:text-white transition-all flex items-center justify-center"
            title="Converter PDF para EPUB"
            aria-label="Converter PDF para EPUB"
          >
            <FileCode2Icon class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <div class="h-px bg-divider/60 w-full"></div>

    <!-- BLOCO 2: ANOTAÇÕES DO ÚLTIMO LIVRO (Clean e sem caixas) -->
    <section class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
          <FileTextIcon class="w-3.5 h-3.5 text-accent" />
          Anotações & Destaques de {{ activeBookShortTitle }}
        </div>
        <NuxtLink to="/revisao" class="font-technical text-xs text-accent hover:underline flex items-center gap-1">
          Ver todas →
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="note in activeBookNotes"
          :key="note.id"
          class="flex flex-col gap-2 py-2"
        >
          <div class="flex items-center justify-between text-xs">
            <span class="font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">
              {{ note.chapter }} · Pág. {{ note.page }}
            </span>
            <span class="font-technical text-[10px] text-textSecondary">{{ note.date }}</span>
          </div>

          <blockquote class="border-l-2 border-accent pl-3 text-xs font-interface italic text-textPrimary/90 leading-relaxed">
            "{{ note.quote }}"
          </blockquote>

          <p class="font-interface text-xs text-textSecondary leading-relaxed pl-3">
            {{ note.insight }}
          </p>
        </div>
      </div>
    </section>

    <div class="h-px bg-divider/60 w-full"></div>

    <!-- BLOCO 3: FLASHCARDS DO DIA (Clean, sem caixa, com botão direto) -->
    <section class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
          <BrainIcon class="w-3.5 h-3.5 text-accent" />
          Flashcards do Dia
        </div>
        <NuxtLink to="/revisao" class="font-technical text-xs text-accent hover:underline flex items-center gap-1">
          Central de Revisão →
        </NuxtLink>
      </div>

      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
        <div class="flex flex-col gap-1.5 flex-1">
          <span class="font-technical text-[10px] text-accent uppercase font-semibold tracking-wider">
            1º Flashcard de Hoje · {{ dailyFlashcard.chapter }}
          </span>
          <h3 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary leading-snug">
            {{ dailyFlashcard.question }}
          </h3>
        </div>

        <NuxtLink
          to="/revisao"
          class="bg-accent hover:bg-accent/90 text-white font-interface text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-md shrink-0"
        >
          <SparklesIcon class="w-3.5 h-3.5" />
          <span>Fazer Flashcard</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ArrowRightIcon,
  BrainIcon,
  SparklesIcon,
  FileCode2Icon,
  SearchIcon,
  FileTextIcon
} from 'lucide-vue-next'
import ReadingStreak from '~/components/ReadingStreak.vue'
import { useCommandPalette } from '~/composables/useCommandPalette'
import { useUserBooks } from '~/composables/useUserBooks'
import { getCoverUrl } from '~/utils/cover'

const commandPalette = useCommandPalette()
const { userBooks, fetchUserBooks } = useUserBooks()
const coverError = ref(false)

onMounted(async () => {
  try {
    await fetchUserBooks()
  } catch (e) {
    // Fallback gracioso caso backend esteja offline
  }
})

// Livro mais recentemente acessado (baseado em last_accessed_at no backend)
const latestUserBook = computed(() => {
  return userBooks.value.length > 0 ? userBooks.value[0] : null
})

const activeBookTitle = computed(() => {
  return latestUserBook.value?.title || 'O Alienista'
})

const activeBookShortTitle = computed(() => {
  const title = activeBookTitle.value
  return title.length > 25 ? title.substring(0, 25) + '...' : title
})

const activeBookCoverUrl = computed(() => {
  if (latestUserBook.value?.coverPath) {
    return getCoverUrl(latestUserBook.value.coverPath, latestUserBook.value.bookId)
  }
  // Mock com imagem de capa disponível no backend
  return getCoverUrl('storage/covers/O-Alienista.png')
})

const activeBookCurrentPage = computed(() => {
  return latestUserBook.value?.currentPage || 42
})

const activeBookTotalPages = computed(() => {
  return 128
})

const activeBookProgress = computed(() => {
  return Math.min(100, Math.round((activeBookCurrentPage.value / activeBookTotalPages.value) * 100))
})

const activeBookReaderLink = computed(() => {
  if (latestUserBook.value?.bookId) {
    return `/reader?bookId=${latestUserBook.value.bookId}`
  }
  return '/reader'
})

// Anotações mockadas do último livro que está sendo lido
const activeBookNotes = computed(() => {
  return [
    {
      id: 'n1',
      chapter: 'Capítulo III',
      page: 42,
      date: 'Hoje',
      quote: 'A razão é a perfeita saúde da alma; a loucura é a alteração dessa saúde.',
      insight: 'Simão Bacamarte estabelece uma fronteira arbitrária entre sanidade e desvio mental, ilustrando o perigo do cientificismo cego.'
    },
    {
      id: 'n2',
      chapter: 'Capítulo I',
      page: 18,
      date: 'Ontem',
      quote: 'A ciência é o meu único norte; não busco a glória dos homens, mas a verdade das coisas.',
      insight: 'O rigor metodológico de Bacamarte se transforma em uma obsessão dogmática ao longo da narrativa.'
    }
  ]
})

// Primeiro Flashcard do Dia
const dailyFlashcard = computed(() => {
  return {
    id: 'f1',
    bookTitle: activeBookShortTitle.value,
    chapter: 'Cap. III: A Casa Verde',
    question: 'Qual é o critério inicial usado por Simão Bacamarte para internar pacientes na Casa Verde?',
    answer: 'Qualquer desvio do equilíbrio moral ou manifestação excessiva de paixão, soberba ou virtude fora do comum.'
  }
})
</script>
