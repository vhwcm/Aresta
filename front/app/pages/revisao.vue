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
      <div class="flex items-center bg-white/5 p-1 rounded-2xl border border-divider">
        <button
          @click="activeTab = 'flashcards'"
          class="px-5 py-2 rounded-xl font-interface text-xs font-medium transition-all flex items-center gap-2"
          :class="activeTab === 'flashcards' ? 'bg-accent text-white shadow-md' : 'text-textSecondary hover:text-white'"
        >
          <LayersIcon class="w-4 h-4" />
          Flashcards ({{ cards.length }})
        </button>
        <button
          @click="activeTab = 'summaries'"
          class="px-5 py-2 rounded-xl font-interface text-xs font-medium transition-all flex items-center gap-2"
          :class="activeTab === 'summaries' ? 'bg-accent text-white shadow-md' : 'text-textSecondary hover:text-white'"
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
            <option value="all">Todas as Obras</option>
            <option value="kuhn">A Estrutura das Revoluções Científicas</option>
            <option value="sapiens">Sapiens</option>
            <option value="norman">O Design do Dia a Dia</option>
          </select>
        </div>

        <div class="flex items-center gap-3 text-xs font-technical text-textSecondary">
          <span>Card {{ currentCardIndex + 1 }} de {{ filteredCards.length }}</span>
          <div class="w-24 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              class="h-full bg-accent transition-all duration-300 rounded-full"
              :style="{ width: `${((currentCardIndex + 1) / (filteredCards.length || 1)) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Container do Flashcard Interativo (Flip 3D) -->
      <div v-if="currentCard" class="flex flex-col items-center gap-6">
        <div
          class="card-scene w-full max-w-xl h-80 cursor-pointer select-none"
          @click="isFlipped = !isFlipped"
        >
          <div class="card-object" :class="{ 'is-flipped': isFlipped }">
            <!-- FACE FRENTE (Pergunta) -->
            <div class="card-face card-front p-8 flex flex-col justify-between rounded-3xl bg-bgPanel/95 border border-divider hover:border-accent/40 shadow-2xl backdrop-blur-xl transition-all">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-divider font-technical text-[10px] text-textSecondary uppercase tracking-wider">
                  {{ currentCard.bookTitle }}
                </span>
                <span class="font-technical text-[10px] text-accent flex items-center gap-1">
                  <RotateCwIcon class="w-3 h-3" />
                  Clique para virar
                </span>
              </div>

              <div class="my-auto text-center px-4">
                <span class="font-technical text-xs uppercase tracking-widest text-textSecondary mb-2 block font-medium">Pergunta Conceitual</span>
                <h3 class="font-editorial text-2xl md:text-3xl font-light text-textPrimary leading-snug">
                  {{ currentCard.question }}
                </h3>
              </div>

              <div class="flex items-center justify-center text-xs text-textSecondary font-interface">
                <span>Toque no cartão para ver a resposta</span>
              </div>
            </div>

            <!-- FACE VERSO (Resposta) -->
            <div class="card-face card-back p-8 flex flex-col justify-between rounded-3xl bg-bgPanel/95 border border-accent/40 shadow-2xl backdrop-blur-xl">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 font-technical text-[10px] text-accent uppercase tracking-wider">
                  Resposta Explicada
                </span>
                <span class="font-technical text-[10px] text-textSecondary">
                  Capítulo: {{ currentCard.chapter }}
                </span>
              </div>

              <div class="my-auto text-center px-4">
                <p class="font-interface text-sm md:text-base text-textPrimary leading-relaxed font-normal">
                  {{ currentCard.answer }}
                </p>
              </div>

              <div class="flex items-center justify-between text-[11px] text-textSecondary font-technical border-t border-divider pt-2">
                <span>Revisão Espaçada</span>
                <span class="text-accent">Aresta Memory Engine</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Botões de Autoavaliação da Repetição Espaçada -->
        <div v-if="isFlipped" class="flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            @click="rateCard('hard')"
            class="px-5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-interface text-xs font-medium transition-all"
          >
            Difícil (Repetir amanhã)
          </button>
          <button
            @click="rateCard('good')"
            class="px-5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-interface text-xs font-medium transition-all"
          >
            Bom (3 dias)
          </button>
          <button
            @click="rateCard('easy')"
            class="px-5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-interface text-xs font-medium transition-all"
          >
            Fácil (7 dias)
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  LayersIcon,
  FileTextIcon,
  RotateCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon
} from 'lucide-vue-next'
import { useReadingStreak } from '~/composables/useReadingStreak'

interface Flashcard {
  id: string
  bookId: string
  bookTitle: string
  chapter: string
  question: string
  answer: string
}

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

const cards = ref<Flashcard[]>([
  {
    id: '1',
    bookId: 'kuhn',
    bookTitle: 'A Estrutura das Revoluções Científicas',
    chapter: 'Cap. II: O Caminho para a Ciência Normal',
    question: 'O que caracteriza a "Ciência Normal" segundo Thomas Kuhn?',
    answer: 'É a pesquisa firmemente baseada em uma ou mais realizações científicas passadas, que uma comunidade científica reconhece como base para sua prática posterior de resolução de quebra-cabeças.'
  },
  {
    id: '2',
    bookId: 'kuhn',
    bookTitle: 'A Estrutura das Revoluções Científicas',
    chapter: 'Cap. IX: A Natureza das Revoluções Científicas',
    question: 'O que define uma mudança de paradigma?',
    answer: 'É uma ruptura não-cumulativa onde um paradigma antigo é total ou parcialmente substituído por um novo e incompatível, alterando a visão de mundo da comunidade científica.'
  },
  {
    id: '3',
    bookId: 'sapiens',
    bookTitle: 'Sapiens',
    chapter: 'Cap. 2: A Árvore do Conhecimento',
    question: 'Qual foi o principal gatilho da Revolução Cognitiva há 70.000 anos?',
    answer: 'O surgimento da capacidade linguística de transmitir informações sobre coisas que não existem no mundo físico (a habilidade de criar e acreditar em ficções e mitos compartilhados).'
  },
  {
    id: '4',
    bookId: 'norman',
    bookTitle: 'O Design do Dia a Dia',
    chapter: 'Cap. 1: As Coisas Psicológicas Cotidianas',
    question: 'O que é uma "Affordance" no design de interfaces?',
    answer: 'É a relação entre as propriedades físicas de um objeto e as capacidades do agente que determinam como o objeto pode ser utilizado (ex: uma maçaneta plana convida a empurrar).'
  },
  {
    id: '5',
    bookId: 'sapiens',
    bookTitle: 'Sapiens',
    chapter: 'Cap. 5: O Maior Golpe da História',
    question: 'Por que Harari chama a Revolução Agrícola de "o maior golpe da história"?',
    answer: 'Porque embora tenha aumentado o total de alimentos disponíveis para a espécie, gerou dietas piores, mais horas de trabalho extenuante e maior vulnerabilidade a pragas e secas para a média dos indivíduos.'
  }
])

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

const streak = useReadingStreak()

const filteredCards = computed(() => {
  if (selectedBookFilter.value === 'all') return cards.value
  return cards.value.filter((c) => c.bookId === selectedBookFilter.value)
})

const currentCard = computed(() => filteredCards.value[currentCardIndex.value] || null)

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

const rateCard = async (_rating: 'hard' | 'good' | 'easy') => {
  void streak.recordFlashcardReview(1)

  if (currentCardIndex.value < filteredCards.value.length - 1) {
    nextCard()
  } else {
    isFlipped.value = false
  }
}

const createCardFromSummary = (summary: AnnotationSummary) => {
  cards.value.push({
    id: String(Date.now()),
    bookId: 'custom',
    bookTitle: summary.bookTitle,
    chapter: summary.chapter,
    question: `Qual a importância de "${summary.topic}"?`,
    answer: summary.aiSynthesis
  })
  activeTab.value = 'flashcards'
  currentCardIndex.value = cards.value.length - 1
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
