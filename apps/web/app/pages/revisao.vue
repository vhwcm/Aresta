<template>
  <div class="flex flex-col gap-12 pb-16">
    <!-- Cabeçalho Editorial -->
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2 font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">
          Retenção & Síntese
        </div>
        <h1 class="font-editorial text-4xl md:text-5xl font-light text-textPrimary leading-tight">
          Central de Revisão
        </h1>
        <p class="font-interface text-textSecondary text-base max-w-2xl leading-relaxed">
          Fixe conceitos essenciais com repetição espaçada e consulte resumos inteligentes estruturados a partir das suas anotações e destaques de leitura.
        </p>
      </div>

      <!-- Abas Internas da Revisão -->
      <div class="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-divider">
        <button
          @click="activeTab = 'flashcards'"
          class="px-5 py-2 rounded-xl font-interface text-xs font-medium transition-all flex items-center gap-2"
          :class="activeTab === 'flashcards' ? 'bg-accent text-white shadow-md' : 'text-textSecondary hover:text-textPrimary'"
        >
          <LayersIcon class="w-4 h-4" />
          Flashcards ({{ displayCards.length }})
        </button>
        <button
          @click="activeTab = 'summaries'"
          class="px-5 py-2 rounded-xl font-interface text-xs font-medium transition-all flex items-center gap-2"
          :class="activeTab === 'summaries' ? 'bg-accent text-white shadow-md' : 'text-textSecondary hover:text-textPrimary'"
        >
          <FileTextIcon class="w-4 h-4" />
          Resumos & Anotações ({{ summaries.length }})
        </button>
      </div>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- SEÇÃO 1: FLASHCARDS (Repetição Espaçada 3D) -->
    <section v-if="activeTab === 'flashcards'" class="flex flex-col gap-8">
      <!-- Barra de Controle e Filtro de Livros -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="font-technical text-xs text-textSecondary">Filtrar por Obra:</span>
          <select
            v-model="selectedBookFilter"
            class="bg-bgPanel text-textPrimary text-xs rounded-xl px-3 py-1.5 border border-divider focus:outline-none focus:border-accent"
          >
            <option value="all">Todas as Obras ({{ displayCards.length }})</option>
            <option
              v-for="book in availableBooks"
              :key="book.id"
              :value="String(book.id)"
            >
              {{ book.title }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-3 text-xs font-technical text-textSecondary">
          <span>Card {{ filteredCards.length > 0 ? currentCardIndex + 1 : 0 }} de {{ filteredCards.length }}</span>
          <div class="w-24 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              class="h-full bg-accent transition-all duration-300 rounded-full"
              :style="{ width: `${filteredCards.length > 0 ? ((currentCardIndex + 1) / filteredCards.length) * 100 : 0}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- ESTADO VAZIO: Sem flashcards -->
      <div
        v-if="filteredCards.length === 0 && !flashcards.isLoading.value"
        class="flex flex-col items-center justify-center p-12 rounded-3xl bg-bgPanel/60 border border-divider text-center gap-4 max-w-xl mx-auto"
      >
        <div class="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent">
          <BrainIcon class="w-6 h-6" />
        </div>
        <h3 class="font-editorial text-2xl font-light text-textPrimary">Nenhum Flashcard Pendente</h3>
        <p class="font-interface text-sm text-textSecondary max-w-md">
          Você não possui flashcards pendentes de revisão hoje. Continue lendo seus livros e adicionando anotações para gerar novos cards inteligentes.
        </p>
        <NuxtLink
          to="/"
          class="px-5 py-2.5 rounded-full bg-accent text-white font-interface text-xs font-medium hover:bg-accent/90 transition-all shadow-md mt-2"
        >
          Voltar para Leitura
        </NuxtLink>
      </div>

      <!-- Container do Flashcard Interativo (Flip 3D) -->
      <div v-else-if="currentCard" class="flex flex-col items-center gap-6">
        <div
          class="card-scene w-full max-w-xl h-80 cursor-pointer select-none"
          @click="isFlipped = !isFlipped"
        >
          <div class="card-object" :class="{ 'is-flipped': isFlipped }">
            <!-- FACE FRENTE (Pergunta) -->
            <div class="card-face card-front p-8 flex flex-col justify-between rounded-3xl bg-bgPanel/95 border border-divider hover:border-accent/40 shadow-2xl backdrop-blur-xl transition-all">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-divider font-technical text-[10px] text-textSecondary uppercase tracking-wider truncate max-w-[240px]">
                  {{ currentCard.bookTitle }}
                </span>
                <span class="font-technical text-[10px] text-accent flex items-center gap-1">
                  <RotateCwIcon class="w-3 h-3" />
                  Clique para virar
                </span>
              </div>

              <div class="my-auto text-center px-4">
                <span class="font-technical text-xs uppercase tracking-widest text-textSecondary mb-2 block font-medium">
                  {{ formatCardType(currentCard.cardType) }}
                </span>
                <h3 class="font-editorial text-2xl md:text-3xl font-light text-textPrimary leading-snug">
                  {{ currentCard.question }}
                </h3>
              </div>

              <div class="flex items-center justify-between text-xs text-textSecondary font-interface">
                <span v-if="currentCard.chapterTitle" class="truncate max-w-[300px]">
                  {{ currentCard.chapterTitle }}
                </span>
                <span v-else>Toque no cartão para ver a resposta</span>
                <span class="font-technical text-[10px] text-accent font-semibold">Nível {{ currentCard.repetitionLevel }}</span>
              </div>
            </div>

            <!-- FACE VERSO (Resposta) -->
            <div class="card-face card-back p-8 flex flex-col justify-between rounded-3xl bg-bgPanel/95 border border-accent/40 shadow-2xl backdrop-blur-xl">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 font-technical text-[10px] text-accent uppercase tracking-wider">
                  Resposta Explicada
                </span>
                <span v-if="currentCard.chapterTitle" class="font-technical text-[10px] text-textSecondary truncate max-w-[200px]">
                  {{ currentCard.chapterTitle }}
                </span>
              </div>

              <div class="my-auto text-center px-4 overflow-y-auto max-h-44">
                <p class="font-interface text-sm md:text-base text-textPrimary leading-relaxed font-normal">
                  {{ currentCard.answer }}
                </p>
              </div>

              <div class="flex items-center justify-between text-[11px] text-textSecondary font-technical border-t border-divider pt-2">
                <span>Repetição Espaçada</span>
                <span class="text-accent">Aresta Memory Engine</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Botões de Autoavaliação da Repetição Espaçada -->
        <div v-if="isFlipped" class="flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            @click="rateCurrentCard('hard')"
            :disabled="flashcards.isSubmitting.value"
            class="px-5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-interface text-xs font-medium transition-all disabled:opacity-50"
          >
            Difícil (Repetir amanhã)
          </button>
          <button
            @click="rateCurrentCard('good')"
            :disabled="flashcards.isSubmitting.value"
            class="px-5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-interface text-xs font-medium transition-all disabled:opacity-50"
          >
            Bom (3 dias)
          </button>
          <button
            @click="rateCurrentCard('easy')"
            :disabled="flashcards.isSubmitting.value"
            class="px-5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-interface text-xs font-medium transition-all disabled:opacity-50"
          >
            Fácil (7 dias)
          </button>
          
          <button
            @click="openDidacticModal"
            class="px-4 py-2 rounded-xl bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent font-interface text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            title="Gerar ou anexar livro didático explicativo"
          >
            <SparklesIcon class="w-4 h-4" />
            Explicar com IA (Livreto)
          </button>
        </div>

        <!-- Controles de Navegação Anterior/Próximo -->
        <div class="flex items-center gap-4 text-xs font-interface text-textSecondary">
          <button
            @click="prevCard"
            :disabled="currentCardIndex === 0"
            class="px-3 py-1.5 rounded-lg border border-divider hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1"
          >
            <ChevronLeftIcon class="w-4 h-4" /> Anterior
          </button>
          <button
            @click="nextCard"
            :disabled="currentCardIndex >= filteredCards.length - 1"
            class="px-3 py-1.5 rounded-lg border border-divider hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1"
          >
            Próximo <ChevronRightIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>

    <!-- SEÇÃO 2: RESUMOS & ANOTAÇÕES GERADAS POR IA -->
    <section v-if="activeTab === 'summaries'" class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <h3 class="font-editorial text-2xl font-light text-textPrimary">
          Sínteses e Anotações Inteligentes
        </h3>
        <span class="font-technical text-xs text-textSecondary">
          Extraídas de marcações ativas
        </span>
      </div>

      <div class="flex flex-col gap-6">
        <div
          v-for="summary in summaries"
          :key="summary.id"
          class="p-6 md:p-8 rounded-3xl bg-white/[0.02] hover:bg-white/[0.04] border border-divider transition-all flex flex-col gap-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-divider pb-3">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-accent font-technical text-[10px] font-semibold uppercase">
                {{ summary.bookTitle }}
              </span>
              <span class="text-xs font-interface text-textSecondary">· {{ summary.chapter }}</span>
            </div>
            <span class="font-technical text-[10px] text-textSecondary">{{ summary.date }}</span>
          </div>

          <div class="flex flex-col gap-2">
            <h4 class="font-editorial text-2xl font-light text-textPrimary">
              {{ summary.topic }}
            </h4>
            <blockquote class="p-4 rounded-xl bg-white/5 border-l-2 border-accent text-xs font-interface italic text-textPrimary/90 leading-relaxed">
              "{{ summary.highlightQuote }}"
            </blockquote>
          </div>

          <!-- Resumo estruturado pela IA -->
          <div class="flex flex-col gap-1.5 bg-white/[0.02] p-4 rounded-xl border border-divider/50">
            <span class="font-technical text-[10px] uppercase font-semibold text-accent tracking-wider flex items-center gap-1.5">
              Síntese Aresta IA
            </span>
            <p class="font-interface text-xs text-textSecondary leading-relaxed">
              {{ summary.aiSynthesis }}
            </p>
          </div>

          <div class="flex items-center justify-between pt-2 text-xs">
            <div class="flex items-center gap-2">
              <span v-for="tag in summary.tags" :key="tag" class="font-technical text-[10px] text-textSecondary bg-white/5 px-2 py-0.5 rounded">
                #{{ tag }}
              </span>
            </div>
            <button
              @click="createCardFromSummary(summary)"
              class="px-3 py-1.5 rounded-lg border border-accent/30 hover:bg-accent/15 text-accent font-interface text-xs transition-colors flex items-center gap-1.5"
            >
              <PlusIcon class="w-3.5 h-3.5" />
              Criar Flashcard
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- MODAL DE EXPLICAÇÃO DIDÁTICA COM IA (LIVRETO / CADERNO) -->
    <div
      v-if="isDidacticModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div class="bg-bgPanel border border-divider rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-6">
        <div class="flex items-center justify-between border-b border-divider pb-4">
          <div class="flex items-center gap-2 text-accent">
            <SparklesIcon class="w-5 h-5" />
            <h3 class="font-editorial text-xl text-textPrimary">Didactic AI Tutor</h3>
          </div>
          <button
            @click="isDidacticModalOpen = false"
            class="text-textSecondary hover:text-textPrimary text-sm font-technical"
          >
            ✕ Fechar
          </button>
        </div>

        <div class="flex flex-col gap-4">
          <p class="font-interface text-xs text-textSecondary leading-relaxed">
            A IA didática vai estruturar uma explicação visual paginada com analogias, diagramas Mermaid e callouts sobre o conceito deste flashcard:
          </p>

          <div class="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-divider text-xs font-interface text-textPrimary">
            <strong>Tópico:</strong> {{ currentCard?.question }}
          </div>

          <!-- Seleção de Modo: Novo Livreto vs Appendar em Livreto Existente -->
          <div class="flex flex-col gap-2">
            <label class="font-technical text-xs text-textSecondary uppercase">Destino da Explicação:</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="selectedBookletMode = 'new'"
                class="px-3 py-2.5 rounded-xl border text-xs font-interface font-medium transition-all text-center"
                :class="selectedBookletMode === 'new' ? 'border-accent bg-accent/15 text-accent' : 'border-divider text-textSecondary hover:border-textSecondary'"
              >
                📖 Novo Livreto Avulso
              </button>
              <button
                type="button"
                @click="selectedBookletMode = 'append'"
                :disabled="didactic.booklets.value.length === 0"
                class="px-3 py-2.5 rounded-xl border text-xs font-interface font-medium transition-all text-center disabled:opacity-40"
                :class="selectedBookletMode === 'append' ? 'border-accent bg-accent/15 text-accent' : 'border-divider text-textSecondary hover:border-textSecondary'"
              >
                📎 Anexar a Caderno ({{ didactic.booklets.value.length }})
              </button>
            </div>
          </div>

          <!-- Seletor de Livreto Existente quando Modo = 'append' -->
          <div v-if="selectedBookletMode === 'append'" class="flex flex-col gap-1.5">
            <label class="font-technical text-xs text-textSecondary">Selecione o Livreto Didático:</label>
            <select
              v-model="selectedTargetBookletId"
              class="bg-bgPanel text-textPrimary text-xs rounded-xl p-2.5 border border-divider focus:outline-none focus:border-accent"
            >
              <option
                v-for="b in didactic.booklets.value"
                :key="b.id"
                :value="b.book_id"
              >
                {{ b.title }} ({{ b.chapters?.length || 1 }} capítulos)
              </option>
            </select>
          </div>

          <!-- Seletor de Profundidade -->
          <div class="flex flex-col gap-1.5">
            <label class="font-technical text-xs text-textSecondary">Profundidade Didática:</label>
            <select
              v-model="selectedDepth"
              class="bg-bgPanel text-textPrimary text-xs rounded-xl p-2.5 border border-divider focus:outline-none focus:border-accent"
            >
              <option value="standard">Padrão Equilibrado (~4 páginas, 1 Mermaid)</option>
              <option value="quick_summary">Resumo Rápido (~2 páginas)</option>
              <option value="deep_dive">Aprofundamento Completo (~6 páginas, 2 Mermaids)</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-divider">
          <button
            @click="isDidacticModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs font-interface text-textSecondary hover:text-textPrimary"
          >
            Cancelar
          </button>
          <button
            @click="generateDidacticBooklet"
            :disabled="didactic.isGenerating.value"
            class="px-5 py-2.5 rounded-xl bg-accent text-white font-interface text-xs font-semibold hover:bg-accent/90 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <SparklesIcon v-if="!didactic.isGenerating.value" class="w-4 h-4" />
            <span v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ didactic.isGenerating.value ? 'Gerando Livreto...' : 'Gerar e Abrir no Leitor' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  LayersIcon,
  FileTextIcon,
  RotateCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  BrainIcon,
  SparklesIcon
} from 'lucide-vue-next'
import { useReadingStreak } from '~/composables/useReadingStreak'
import { useFlashcards, type FlashcardItem } from '~/composables/useFlashcards'
import { useDidacticBooklet } from '~/composables/useDidacticBooklet'

interface AnnotationSummary {
  id: string
  bookTitle: string
  chapter: string
  topic: string
  highlightQuote: string
  aiSynthesis: string
  date: string
  tags: string[]
}

const activeTab = ref<'flashcards' | 'summaries'>('flashcards')
const selectedBookFilter = ref('all')
const currentCardIndex = ref(0)
const isFlipped = ref(false)

const streak = useReadingStreak()
const flashcards = useFlashcards()

// Mock inicial como fallback caso o backend esteja vazio ou offline
const fallbackCards = ref<FlashcardItem[]>([
  {
    id: 1,
    userId: 1,
    annotationId: 1,
    bookId: 101,
    bookTitle: 'A Estrutura das Revoluções Científicas',
    bookCover: null,
    chapterTitle: 'Cap. II: O Caminho para a Ciência Normal',
    selectedText: 'A ciência normal consiste na realização da promessa...',
    note: 'Ciência normal e paradigmas',
    cardType: 'CONCEPT_RECALL',
    question: 'O que caracteriza a "Ciência Normal" segundo Thomas Kuhn?',
    answer: 'É a pesquisa firmemente baseada em uma ou mais realizações científicas passadas, que uma comunidade científica reconhece como base para sua prática posterior de resolução de quebra-cabeças.',
    contextSummary: 'Epistemologia kuhniana',
    repetitionLevel: 1,
    nextReviewAt: new Date().toISOString()
  },
  {
    id: 2,
    userId: 1,
    annotationId: 2,
    bookId: 101,
    bookTitle: 'A Estrutura das Revoluções Científicas',
    chapterTitle: 'Cap. IX: A Natureza das Revoluções Científicas',
    bookCover: null,
    selectedText: 'A mudança de paradigma é uma ruptura...',
    note: 'Revoluções científicas',
    cardType: 'CONCEPT_RECALL',
    question: 'O que define uma mudança de paradigma?',
    answer: 'É uma ruptura não-cumulativa onde um paradigma antigo é total ou parcialmente substituído por um novo e incompatível, alterando a visão de mundo da comunidade científica.',
    contextSummary: 'Revolução paradigmática',
    repetitionLevel: 2,
    nextReviewAt: new Date().toISOString()
  },
  {
    id: 3,
    userId: 1,
    annotationId: 3,
    bookId: 102,
    bookTitle: 'Sapiens',
    chapterTitle: 'Cap. 2: A Árvore do Conhecimento',
    bookCover: null,
    selectedText: 'Mitos compartilhados permitiram a cooperação...',
    note: 'Revolução cognitiva',
    cardType: 'REAL_SITUATION',
    question: 'Qual foi o principal gatilho da Revolução Cognitiva há 70.000 anos?',
    answer: 'O surgimento da capacidade linguística de transmitir informações sobre coisas que não existem no mundo físico (a habilidade de criar e acreditar em ficções e mitos compartilhados).',
    contextSummary: 'Evolução social humana',
    repetitionLevel: 1,
    nextReviewAt: new Date().toISOString()
  }
])

const displayCards = computed<FlashcardItem[]>(() => {
  if (flashcards.dailyDeck.value.length > 0) {
    return flashcards.dailyDeck.value
  }
  return fallbackCards.value
})

const availableBooks = computed(() => {
  const map = new Map<number, { id: number; title: string }>()
  for (const c of displayCards.value) {
    if (c.bookId && !map.has(c.bookId)) {
      map.set(c.bookId, { id: c.bookId, title: c.bookTitle })
    }
  }
  return Array.from(map.values())
})

const filteredCards = computed(() => {
  if (selectedBookFilter.value === 'all') return displayCards.value
  return displayCards.value.filter((c) => String(c.bookId) === selectedBookFilter.value)
})

const currentCard = computed(() => filteredCards.value[currentCardIndex.value] || null)

const formatCardType = (cardType?: string) => {
  switch (cardType) {
    case 'REAL_SITUATION':
      return 'Situação Real'
    case 'CONCEPT_UNION':
      return 'União de Conceitos'
    default:
      return 'Relembração de Conceito'
  }
}

const summaries = ref<AnnotationSummary[]>([
  {
    id: 's1',
    bookTitle: 'A Estrutura das Revoluções Científicas',
    chapter: 'Capítulo IV: A Ciência Normal como Resolução de Quebra-Cabeças',
    topic: 'Anomalias e Crise Epistêmica',
    highlightQuote: 'A descoberta começa com a percepção da anomalia, ou seja, com o reconhecimento de que a natureza violou de algum modo as expectativas induzidas pelo paradigma.',
    aiSynthesis: 'Kuhn destaca que as anomalias não destroem um paradigma imediatamente; elas se acumulam até provocarem um período de crise que culmina na transição revolucionária.',
    date: '22 Ago 2026',
    tags: ['Epistemologia', 'Filosofia da Ciência', 'Kuhn']
  },
  {
    id: 's2',
    bookTitle: 'Sapiens: Uma Breve História da Humanidade',
    chapter: 'Capítulo 3: Um Dia na Vida de Adão e Eva',
    topic: 'A Economia Forrageira e a Dieta Humana',
    highlightQuote: 'Os forrageadores antigos sabiam de cor a forma dos arbustos, o cheiro do vento e os hábitos das feras com uma maestria que raramente encontramos hoje.',
    aiSynthesis: 'Os caçadores-coletores possuíam uma dieta mais variada e uma carga de trabalho menor do que as sociedades agrícolas posteriores.',
    date: '20 Ago 2026',
    tags: ['Antropologia', 'Evolução', 'História']
  }
])

onMounted(async () => {
  try {
    await flashcards.fetchDailyDeck()
  } catch (e) {
    // Fallback gracioso
  }
})

const nextCard = () => {
  if (currentCardIndex.value < filteredCards.value.length - 1) {
    isFlipped.value = false
    currentCardIndex.value++
  }
}

const prevCard = () => {
  if (currentCardIndex.value > 0) {
    isFlipped.value = false
    currentCardIndex.value--
  }
}

const rateCurrentCard = async (rating: 'hard' | 'good' | 'easy') => {
  if (!currentCard.value) return

  try {
    if (flashcards.dailyDeck.value.length > 0) {
      await flashcards.reviewFlashcard(currentCard.value.id, rating)
    } else {
      void streak.recordFlashcardReview(1)
    }
  } catch (err) {
    console.error('Erro ao avaliar flashcard:', err)
  }

  if (currentCardIndex.value < filteredCards.value.length - 1) {
    nextCard()
  } else {
    isFlipped.value = false
  }
}

const createCardFromSummary = (summary: AnnotationSummary) => {
  fallbackCards.value.push({
    id: Date.now(),
    userId: 1,
    annotationId: Date.now(),
    bookId: 999,
    bookTitle: summary.bookTitle,
    bookCover: null,
    chapterTitle: summary.chapter,
    selectedText: summary.highlightQuote,
    note: summary.topic,
    cardType: 'CONCEPT_RECALL',
    question: `Qual a importância de "${summary.topic}"?`,
    answer: summary.aiSynthesis,
    contextSummary: 'Criado a partir de anotação',
    repetitionLevel: 1,
    nextReviewAt: new Date().toISOString()
  })
  activeTab.value = 'flashcards'
  currentCardIndex.value = fallbackCards.value.length - 1
}

const router = useRouter()
const didactic = useDidacticBooklet()
const isDidacticModalOpen = ref(false)
const selectedBookletMode = ref<'new' | 'append'>('new')
const selectedTargetBookletId = ref<number | null>(null)
const selectedDepth = ref<'quick_summary' | 'standard' | 'deep_dive'>('standard')

const openDidacticModal = async () => {
  isDidacticModalOpen.value = true
  await didactic.fetchBooklets()
  if (didactic.booklets.value.length > 0 && !selectedTargetBookletId.value) {
    selectedTargetBookletId.value = didactic.booklets.value[0]?.book_id ?? null
  }
}

const generateDidacticBooklet = async () => {
  if (!currentCard.value) return

  const topic = currentCard.value.question
  const title = `Didático: ${currentCard.value.question.slice(0, 45)}...`

  try {
    if (selectedBookletMode.value === 'append' && selectedTargetBookletId.value) {
      const result = await didactic.appendChapter(selectedTargetBookletId.value, {
        topic,
        flashcard_id: currentCard.value.id,
        depth_level: selectedDepth.value,
      })
      isDidacticModalOpen.value = false
      const bookId = result.book?.id || selectedTargetBookletId.value
      await router.push(`/reader?bookId=${bookId}`)
    } else {
      const result = await didactic.createBooklet({
        title,
        topic,
        flashcard_id: currentCard.value.id,
        depth_level: selectedDepth.value,
      })
      isDidacticModalOpen.value = false
      if (result.book?.id) {
        await router.push(`/reader?bookId=${result.book.id}`)
      }
    }
  } catch (err) {
    console.error('Erro ao gerar livro didático com IA:', err)
  }
}
</script>

<style scoped>
.card-scene {
  perspective: 1200px;
}

.card-object {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-object.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}
</style>
