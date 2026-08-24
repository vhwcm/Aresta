<template>
  <div class="flex flex-col gap-12 pb-24 animate-in fade-in duration-500">
    <!-- Top Bar Integrada da Home (Ofensiva no Canto Superior Direito e Busca Desktop) -->
    <div class="flex items-center justify-between gap-4">
      <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
        Leitura Ativa
      </div>

      <!-- Barra de Busca Cmd+K Integrada (Visível APENAS para Desktop) -->
      <div
        class="hidden md:flex flex-1 max-w-md mx-4 items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-divider hover:border-white/20 transition-all cursor-pointer group text-textSecondary"
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

      <!-- Canto Superior Direito: Ofensiva em Dias (Ícone + Número em Dias) -->
      <div class="flex items-center gap-2 ml-auto">
        <ReadingStreak />
      </div>
    </div>

    <!-- BLOCO 1: CONTINUE SUA ÚLTIMA LEITURA (Baseado em last_accessed_at no backend) -->
    <section class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <span class="font-technical text-[10px] uppercase font-semibold tracking-widest text-accent flex items-center gap-1.5">
          <BookOpenIcon class="w-3.5 h-3.5" />
          Continue sua última leitura
        </span>
        <NuxtLink to="/library" class="font-technical text-xs text-textSecondary hover:text-white flex items-center gap-1 transition-colors">
          Ver todos os livros →
        </NuxtLink>
      </div>

      <div class="flex flex-col gap-4">
        <h1 class="font-editorial text-4xl md:text-5xl font-light text-textPrimary leading-tight">
          {{ activeBookTitle }}
        </h1>
        <p class="font-interface text-base md:text-lg text-textSecondary max-w-2xl leading-relaxed">
          {{ activeBookDescription }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-4 md:gap-6 mt-2">
        <NuxtLink
          :to="activeBookReaderLink"
          class="bg-white text-black font-interface text-xs md:text-sm font-medium px-6 py-3 rounded-full hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg shadow-white/10"
        >
          Continuar Leitura
          <ArrowRightIcon class="w-4 h-4" />
        </NuxtLink>

        <NuxtLink
          to="/conversor"
          class="px-5 py-3 rounded-full border border-divider bg-white/5 hover:bg-white/10 text-textPrimary font-interface text-xs md:text-sm transition-colors flex items-center gap-2"
        >
          <FileCode2Icon class="w-4 h-4 text-accent" />
          Converter PDF para EPUB
        </NuxtLink>

        <div class="flex items-center gap-3 text-textSecondary font-technical text-xs ml-auto">
          <span>Pág. {{ activeBookCurrentPage }} de {{ activeBookTotalPages }}</span>
          <span>·</span>
          <span class="text-accent font-semibold">{{ activeBookProgress }}% concluído</span>
        </div>
      </div>
    </section>

    <div class="h-px bg-divider w-full"></div>

    <!-- BLOCO 2: ANOTAÇÕES DO ÚLTIMO LIVRO (Mockadas com dados da leitura atual) -->
    <section class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
          <FileTextIcon class="w-3.5 h-3.5 text-accent" />
          Anotações & Destaques de {{ activeBookShortTitle }}
        </div>
        <NuxtLink to="/revisao" class="font-technical text-xs text-accent hover:underline flex items-center gap-1">
          Ver todas as anotações →
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="note in activeBookNotes"
          :key="note.id"
          class="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-divider hover:border-white/20 transition-all flex flex-col justify-between gap-4 group"
        >
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">
                {{ note.chapter }} · Pág. {{ note.page }}
              </span>
              <span class="font-technical text-[10px] text-textSecondary">{{ note.date }}</span>
            </div>

            <blockquote class="p-4 rounded-xl bg-white/5 border-l-2 border-accent text-xs font-interface italic text-textPrimary/90 leading-relaxed">
              "{{ note.quote }}"
            </blockquote>

            <div class="flex flex-col gap-1 bg-white/[0.02] p-3 rounded-xl border border-divider/40">
              <span class="font-technical text-[9px] uppercase font-semibold text-accent tracking-wider flex items-center gap-1">
                <SparklesIcon class="w-3 h-3" />
                Síntese / Insight
              </span>
              <p class="font-interface text-xs text-textSecondary leading-relaxed">
                {{ note.insight }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-divider/40 text-xs">
            <div class="flex items-center gap-1.5">
              <span v-for="tag in note.tags" :key="tag" class="font-technical text-[10px] text-textSecondary bg-white/5 px-2 py-0.5 rounded">
                #{{ tag }}
              </span>
            </div>
            <NuxtLink
              :to="`/revisao`"
              class="font-interface text-xs text-accent hover:underline flex items-center gap-1"
            >
              Revisar ↗
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <div class="h-px bg-divider w-full"></div>

    <!-- BLOCO 3: FLASHCARDS DO DIA (Primeiro Flashcard do Dia + Ação Direta para Revisão) -->
    <section class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
          <BrainIcon class="w-3.5 h-3.5 text-accent" />
          Flashcards do Dia
        </div>
        <NuxtLink to="/revisao" class="font-technical text-xs text-accent hover:underline flex items-center gap-1">
          Ir para Central de Revisão →
        </NuxtLink>
      </div>

      <!-- Card do Primeiro Flashcard do Dia -->
      <div class="p-8 rounded-3xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-divider hover:border-accent/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group">
        <div class="flex flex-col gap-4 flex-1">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 font-technical text-[10px] text-accent uppercase font-semibold tracking-wider">
              1º Flashcard de Hoje
            </span>
            <span class="font-technical text-xs text-textSecondary">
              {{ dailyFlashcard.bookTitle }} · {{ dailyFlashcard.chapter }}
            </span>
          </div>

          <h3 class="font-editorial text-2xl md:text-3xl font-light text-textPrimary leading-snug group-hover:text-white transition-colors">
            {{ dailyFlashcard.question }}
          </h3>

          <p class="font-interface text-textSecondary text-xs md:text-sm leading-relaxed max-w-2xl">
            Pratique repetição espaçada para reter os conceitos fundamentais da sua última leitura antes que a curva do esquecimento atue.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <NuxtLink
            to="/revisao"
            class="bg-accent hover:bg-accent/90 text-white font-interface text-xs md:text-sm font-medium px-6 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
          >
            <SparklesIcon class="w-4 h-4" />
            Fazer Flashcard Agora
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  ArrowRightIcon,
  BrainIcon,
  SparklesIcon,
  BookOpenIcon,
  FileCode2Icon,
  SearchIcon,
  FileTextIcon
} from 'lucide-vue-next'
import ReadingStreak from '~/components/ReadingStreak.vue'
import { useCommandPalette } from '~/composables/useCommandPalette'
import { useUserBooks } from '~/composables/useUserBooks'

const commandPalette = useCommandPalette()
const { userBooks, fetchUserBooks } = useUserBooks()

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
  return latestUserBook.value?.title || 'A Estrutura das Revoluções Científicas'
})

const activeBookShortTitle = computed(() => {
  const title = activeBookTitle.value
  return title.length > 30 ? title.substring(0, 30) + '...' : title
})

const activeBookDescription = computed(() => {
  if (latestUserBook.value) {
    return `Você está no progresso da leitura de "${latestUserBook.value.title}". Continue de onde parou para manter sua ofensiva ativa.`
  }
  return 'Thomas S. Kuhn argumenta que a ciência não progride de forma linear cumulativa, mas através de rupturas de paradigma. Uma leitura basilar para entender como o conhecimento se transforma.'
})

const activeBookCurrentPage = computed(() => {
  return latestUserBook.value?.currentPage || 124
})

const activeBookTotalPages = computed(() => {
  return 352
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
      chapter: 'Capítulo IV',
      page: 124,
      date: 'Hoje, 10:45',
      quote: 'A descoberta começa com a percepção da anomalia, ou seja, com o reconhecimento de que a natureza violou de algum modo as expectativas induzidas pelo paradigma.',
      insight: 'As anomalias não destroem um paradigma imediatamente; elas se acumulam até provocarem um período de crise que culmina na transição revolucionária.',
      tags: ['Epistemologia', 'Anomalias']
    },
    {
      id: 'n2',
      chapter: 'Capítulo II',
      page: 86,
      date: 'Ontem, 18:20',
      quote: 'A ciência normal não tem como objetivo descobrir novidades factuais ou teóricas e, quando é bem-sucedida, não encontra nenhuma.',
      insight: 'A prática científica padrão é focada na resolução de quebra-cabeças dentro de fronteiras pré-estabelecidas pelo consenso.',
      tags: ['Ciência Normal', 'Paradigmas']
    }
  ]
})

// Primeiro Flashcard do Dia
const dailyFlashcard = computed(() => {
  return {
    id: 'f1',
    bookTitle: activeBookShortTitle.value,
    chapter: 'Cap. II: O Caminho para a Ciência Normal',
    question: 'O que caracteriza a "Ciência Normal" segundo Thomas Kuhn?',
    answer: 'É a pesquisa firmemente baseada em uma ou mais realizações científicas passadas reconhecidas por uma comunidade como base para a resolução de problemas.'
  }
})
</script>

