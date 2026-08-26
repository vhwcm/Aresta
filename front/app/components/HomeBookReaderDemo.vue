<template>
  <div
    data-testid="home-book-reader-demo"
    class="w-full rounded-3xl bg-gradient-to-b from-[#141518]/90 via-[#0e0f11]/95 to-[#070708] border border-divider/90 shadow-2xl p-4 sm:p-7 flex flex-col gap-6 relative overflow-hidden backdrop-blur-xl group hover:border-accent/40 transition-all duration-500"
  >
    <!-- Topo da Seção de Demonstração -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-divider/60">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span class="font-technical text-xs uppercase tracking-widest text-accent font-semibold">
            Demonstração Interativa do Leitor
          </span>
        </div>
        <h3 class="font-editorial text-2xl sm:text-3xl font-light text-textPrimary">
          Experiência de Leitura Imersiva
        </h3>
        <p class="font-interface text-xs sm:text-sm text-textSecondary max-w-xl">
          Teste a virada de páginas, altere temas de cor e tipografia, clique nos trechos destacados para ver anotações ativas ou gere um flashcard de retenção imediato.
        </p>
      </div>

      <!-- Ação Direta para o Leitor Completo -->
      <NuxtLink
        to="/reader"
        class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-interface text-xs sm:text-sm font-semibold hover:bg-gray-200 transition-all shadow-md shrink-0 cursor-pointer"
      >
        <span>Abrir Leitor Completo</span>
        <ArrowRightIcon class="w-4 h-4 text-black" />
      </NuxtLink>
    </div>

    <!-- Barra de Controles Rápidos da Leitura (Tema, Tipografia, Tamanho de Fonte) -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-divider/70">
      <!-- Metadados da Obra -->
      <div class="flex items-center gap-2.5 min-w-0">
        <BookOpenIcon class="w-4 h-4 text-accent shrink-0" />
        <span class="font-interface text-xs font-semibold text-textPrimary truncate">
          Machado de Assis · O Alienista
        </span>
        <span class="hidden sm:inline font-technical text-[11px] text-textSecondary">
          (Cap. {{ currentPageData.chapterNum }})
        </span>
      </div>

      <!-- Controles de Leitura -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Seletor de Tema (Dark, Sépia, Light) -->
        <div class="flex items-center bg-white/5 border border-divider p-0.5 rounded-xl">
          <button
            @click="readerTheme = 'dark'"
            :data-testid="'theme-dark-btn'"
            class="px-2.5 py-1 rounded-lg text-[11px] font-technical transition-all cursor-pointer"
            :class="readerTheme === 'dark' ? 'bg-white/15 text-white font-bold' : 'text-textSecondary hover:text-white'"
            title="Modo Noturno (Padrão Aresta)"
          >
            Noite
          </button>
          <button
            @click="readerTheme = 'sepia'"
            :data-testid="'theme-sepia-btn'"
            class="px-2.5 py-1 rounded-lg text-[11px] font-technical transition-all cursor-pointer"
            :class="readerTheme === 'sepia' ? 'bg-[#D4C3A3]/25 text-[#E6D5B8] font-bold' : 'text-textSecondary hover:text-white'"
            title="Modo Sépia"
          >
            Sépia
          </button>
          <button
            @click="readerTheme = 'light'"
            :data-testid="'theme-light-btn'"
            class="px-2.5 py-1 rounded-lg text-[11px] font-technical transition-all cursor-pointer"
            :class="readerTheme === 'light' ? 'bg-white/90 text-black font-bold' : 'text-textSecondary hover:text-white'"
            title="Modo Claro"
          >
            Claro
          </button>
        </div>

        <!-- Seletor de Fonte -->
        <div class="flex items-center bg-white/5 border border-divider p-0.5 rounded-xl">
          <button
            @click="fontFamily = 'editorial'"
            class="px-2.5 py-1 rounded-lg text-[11px] font-editorial transition-all cursor-pointer"
            :class="fontFamily === 'editorial' ? 'bg-white/15 text-white font-semibold' : 'text-textSecondary hover:text-white'"
            title="Fonte Serifada Clássica"
          >
            Serif
          </button>
          <button
            @click="fontFamily = 'interface'"
            class="px-2.5 py-1 rounded-lg text-[11px] font-interface transition-all cursor-pointer"
            :class="fontFamily === 'interface' ? 'bg-white/15 text-white font-semibold' : 'text-textSecondary hover:text-white'"
            title="Fonte Moderna Sem Serifa"
          >
            Sans
          </button>
          <button
            @click="fontFamily = 'technical'"
            class="px-2.5 py-1 rounded-lg text-[11px] font-technical transition-all cursor-pointer"
            :class="fontFamily === 'technical' ? 'bg-white/15 text-white font-semibold' : 'text-textSecondary hover:text-white'"
            title="Fonte Monospaçada"
          >
            Mono
          </button>
        </div>

        <!-- Tamanho da Fonte -->
        <div class="flex items-center bg-white/5 border border-divider p-0.5 rounded-xl">
          <button
            @click="fontSize = Math.max(13, fontSize - 1)"
            class="w-7 h-6 rounded-lg text-xs font-technical flex items-center justify-center text-textSecondary hover:text-white cursor-pointer"
            title="Diminuir fonte"
          >
            A-
          </button>
          <span class="text-[10px] font-technical px-1.5 text-accent font-semibold">{{ fontSize }}px</span>
          <button
            @click="fontSize = Math.min(20, fontSize + 1)"
            class="w-7 h-6 rounded-lg text-xs font-technical flex items-center justify-center text-textSecondary hover:text-white cursor-pointer"
            title="Aumentar fonte"
          >
            A+
          </button>
        </div>
      </div>
    </div>

    <!-- Stage do Livro: Folha com Estilização Conforme Tema Escolhido -->
    <div
      class="relative w-full rounded-2xl border transition-all duration-300 p-6 sm:p-10 min-h-[360px] flex flex-col justify-between shadow-xl"
      :class="themeClasses.container"
    >
      <!-- Cabeçalho da Página do Livro -->
      <div class="flex items-center justify-between pb-4 border-b text-xs font-technical" :class="themeClasses.header">
        <span class="uppercase tracking-wider font-medium">{{ currentPageData.bookTitle }}</span>
        <span>{{ currentPageData.chapterTitle }}</span>
        <span>Pág. {{ currentPageData.pageNumber }}</span>
      </div>

      <!-- Corpo Textual da Página -->
      <div class="py-6 sm:py-8 flex flex-col gap-4 text-justify leading-relaxed transition-all" :class="[fontFamilyClass, themeClasses.text]" :style="{ fontSize: `${fontSize}px` }">
        <p v-for="(paragraph, idx) in currentPageData.paragraphs" :key="idx">
          <template v-if="paragraph.highlight">
            <span>{{ paragraph.before }}</span>
            <span
              @click="handleHighlightClick(paragraph.highlight)"
              class="relative inline cursor-pointer px-1 py-0.5 rounded transition-all group/hl border-b-2"
              :class="themeClasses.highlight"
              :title="'Clique para ver a anotação e gerar flashcard'"
            >
              <span>{{ paragraph.highlight.text }}</span>
              <SparklesIcon class="inline w-3.5 h-3.5 text-accent ml-1 -mt-0.5 opacity-80 group-hover/hl:opacity-100 group-hover/hl:scale-110 transition-transform" />
            </span>
            <span>{{ paragraph.after }}</span>
          </template>
          <template v-else>
            {{ paragraph.text }}
          </template>
        </p>
      </div>

      <!-- Rodapé da Página: Navegação & Barra de Progresso -->
      <div class="flex items-center justify-between pt-4 border-t" :class="themeClasses.header">
        <!-- Botão Página Anterior -->
        <button
          @click="prevPage"
          :disabled="currentPageIndex === 0"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-technical transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          :class="themeClasses.navBtn"
        >
          <ChevronLeftIcon class="w-4 h-4" />
          <span class="hidden sm:inline">Página Anterior</span>
        </button>

        <!-- Indicador de Páginas & Dots -->
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5">
            <button
              v-for="(_, pIdx) in demoPages"
              :key="pIdx"
              @click="currentPageIndex = pIdx"
              class="w-2.5 h-2.5 rounded-full transition-all cursor-pointer"
              :class="currentPageIndex === pIdx ? 'bg-accent w-5' : 'bg-white/20 hover:bg-white/40'"
              :title="`Ir para página ${pIdx + 1}`"
            ></button>
          </div>
          <span class="text-xs font-technical text-textSecondary ml-2">
            {{ currentPageIndex + 1 }} / {{ demoPages.length }} ({{ Math.round(((currentPageIndex + 1) / demoPages.length) * 100) }}%)
          </span>
        </div>

        <!-- Botão Próxima Página -->
        <button
          @click="nextPage"
          :disabled="currentPageIndex === demoPages.length - 1"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-technical transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          :class="themeClasses.navBtn"
        >
          <span class="hidden sm:inline">Próxima Página</span>
          <ChevronRightIcon class="w-4 h-4" />
        </button>
      </div>

      <!-- Card Flutuante Interativo de Destaque / Anotação (Aparece ao Clicar no Trecho) -->
      <div
        v-if="activeHighlight"
        data-testid="highlight-popover"
        class="absolute bottom-16 sm:bottom-20 left-4 right-4 sm:left-12 sm:right-12 z-30 p-4 sm:p-5 rounded-2xl bg-[#121316]/95 border border-accent/40 shadow-2xl backdrop-blur-xl text-textPrimary flex flex-col gap-3 animate-fadeIn"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            <span class="font-technical text-[10px] uppercase tracking-widest text-accent font-semibold">
              Anotação Reflexiva Vinculada
            </span>
          </div>
          <button
            @click="activeHighlight = null"
            class="text-textSecondary hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <blockquote class="font-editorial italic text-xs sm:text-sm text-textPrimary border-l-2 border-accent pl-3 leading-snug">
          "{{ activeHighlight.text }}"
        </blockquote>

        <p class="font-interface text-xs text-textSecondary leading-relaxed">
          {{ activeHighlight.insight }}
        </p>

        <div class="flex items-center justify-between pt-2 border-t border-divider/60 flex-wrap gap-2">
          <!-- Tags de nós do grafo -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span
              v-for="tag in activeHighlight.tags"
              :key="tag"
              class="px-2 py-0.5 rounded-md bg-accent/15 border border-accent/30 text-accent font-technical text-[10px]"
            >
              #{{ tag }}
            </span>
          </div>

          <!-- Botão Gerar Flashcard -->
          <button
            @click="openFlashcard(activeHighlight)"
            data-testid="generate-flashcard-btn"
            class="px-3.5 py-1.5 rounded-xl bg-accent text-white font-interface text-xs font-semibold hover:bg-accent/90 transition-all flex items-center gap-1.5 shadow-md shadow-accent/20 cursor-pointer"
          >
            <BrainIcon class="w-3.5 h-3.5" />
            <span>Gerar Flashcard de Retenção</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal / Flipcard Interativo de Flashcard de Demonstração -->
    <div
      v-if="isFlashcardOpen"
      data-testid="flashcard-modal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      @click.self="isFlashcardOpen = false"
    >
      <div class="w-full max-w-lg rounded-3xl bg-[#16171a] border border-accent/40 p-6 sm:p-8 flex flex-col gap-5 shadow-2xl relative text-left">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <BrainIcon class="w-4 h-4" />
            </div>
            <div>
              <span class="font-technical text-[10px] uppercase tracking-widest text-accent font-semibold">
                Flashcard de Repetição Espaçada
              </span>
              <h4 class="font-interface text-sm font-semibold text-textPrimary">
                Curva de Retenção Ebbinghaus
              </h4>
            </div>
          </div>
          <button
            @click="isFlashcardOpen = false"
            class="p-2 rounded-xl text-textSecondary hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Card Frent e Verso com Efeito Flip -->
        <div
          @click="isFlashcardFlipped = !isFlashcardFlipped"
          class="w-full min-h-[160px] p-5 rounded-2xl bg-black/50 border border-divider hover:border-accent/50 transition-all flex flex-col justify-between cursor-pointer select-none group"
        >
          <div class="flex items-center justify-between">
            <span class="font-technical text-[10px] uppercase tracking-wider text-textSecondary">
              {{ isFlashcardFlipped ? 'Resposta do Flashcard' : 'Pergunta Reflexiva (Clique para virar)' }}
            </span>
            <RotateCcwIcon class="w-3.5 h-3.5 text-accent group-hover:rotate-180 transition-transform duration-500" />
          </div>

          <p class="font-editorial text-base sm:text-lg text-textPrimary leading-relaxed py-3">
            {{ isFlashcardFlipped ? currentFlashcardData.answer : currentFlashcardData.question }}
          </p>

          <span class="font-technical text-[10px] text-accent">
            {{ isFlashcardFlipped ? '✓ Pronto para agendar repetição' : '💡 Clique no cartão para revelar a resposta' }}
          </span>
        </div>

        <!-- Intervalos de Repetição Espaçada -->
        <div class="flex items-center justify-between pt-2 border-t border-divider/60 gap-2">
          <button
            @click="handleAnswerFlashcard('dificil')"
            class="flex-1 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-interface text-xs hover:bg-rose-500/20 transition-all cursor-pointer"
          >
            Difícil (1 dia)
          </button>
          <button
            @click="handleAnswerFlashcard('bom')"
            class="flex-1 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-interface text-xs hover:bg-amber-500/20 transition-all cursor-pointer"
          >
            Bom (3 dias)
          </button>
          <button
            @click="handleAnswerFlashcard('facil')"
            class="flex-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-interface text-xs hover:bg-emerald-500/20 transition-all cursor-pointer"
          >
            Fácil (7 dias)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  BrainIcon,
  XIcon,
  RotateCcwIcon,
  ArrowRightIcon
} from 'lucide-vue-next'

interface HighlightData {
  text: string
  insight: string
  tags: string[]
  question: string
  answer: string
}

interface DemoParagraph {
  text?: string
  before?: string
  highlight?: HighlightData
  after?: string
}

interface DemoPage {
  bookTitle: string
  chapterNum: string
  chapterTitle: string
  pageNumber: number
  paragraphs: DemoParagraph[]
}

const readerTheme = ref<'dark' | 'sepia' | 'light'>('dark')
const fontFamily = ref<'editorial' | 'interface' | 'technical'>('editorial')
const fontSize = ref(16)
const currentPageIndex = ref(0)
const activeHighlight = ref<HighlightData | null>(null)
const isFlashcardOpen = ref(false)
const isFlashcardFlipped = ref(false)
const currentFlashcardData = ref<{ question: string; answer: string }>({
  question: '',
  answer: ''
})

const demoPages: DemoPage[] = [
  {
    bookTitle: 'O Alienista',
    chapterNum: 'III',
    chapterTitle: 'A Casa Verde',
    pageNumber: 42,
    paragraphs: [
      {
        before: 'O ilustre médico declarou aos vereadores que ',
        highlight: {
          text: 'a razão é a perfeita saúde da alma; a loucura é a alteração dessa saúde.',
          insight: 'Simão Bacamarte estabelece uma fronteira arbitrária entre a sanidade e o desvio, demonstrando o perigo do cientificismo sem autocrítica.',
          tags: ['epistemologia', 'filosofia-da-mente', 'alienista'],
          question: 'Como Simão Bacamarte define a relação entre razão e loucura no início de sua pesquisa?',
          answer: 'Ele define a razão como o estado de perfeito equilíbrio moral e anímico, tratando qualquer desvio ou paixão exacerbada como manifestação patológica.'
        },
        after: ' E acrescentou que, assim como havia leis para o corpo, cumpria descobrir e aplicar as leis do espírito humano.'
      },
      {
        text: 'A vila inteira acolheu a fundação do asilo com entusiasmo e veneração. Ninguém supunha que, dentro de poucas semanas, o critério de internação se tornaria tão elástico que quase metade da população seria diagnosticada com demência moral.'
      },
      {
        text: 'Bacamarte passava as noites em claro, debruçado sobre tomos de medicina antiga e tratados árabes, buscando a fórmula matemática para classificar todas as faculdades da mente humana.'
      }
    ]
  },
  {
    bookTitle: 'O Alienista',
    chapterNum: 'IV',
    chapterTitle: 'A Rebelião da Razão',
    pageNumber: 43,
    paragraphs: [
      {
        before: 'Em conversa com o boticário Crispim Soares, o alienista proferiu a sua sentença mais célebre: ',
        highlight: {
          text: 'A ciência é a minha esposa única, e a Casa Verde o meu laboratório.',
          insight: 'O isolamento total do intelectual que rejeita a vida afetiva em favor de uma hipótese dogmática.',
          tags: ['cientificismo', 'psicologia', 'autoridade'],
          question: 'O que a dedicação exclusiva de Bacamarte à ciência revela sobre o seu caráter?',
          answer: 'Revela um desapego dogmático da realidade prática e das relações humanas, colocando a teoria científica acima de qualquer consideração moral ou empática.'
        },
        after: ' Nada mais existia para ele fora daquele edifício de quatrocentos quartos.'
      },
      {
        text: 'Não tardou para que o padre Lopes e até a esposa do próprio médico, D. Evarista, fossem examinados sob a lente implacável da nova patologia.'
      }
    ]
  },
  {
    bookTitle: 'O Alienista',
    chapterNum: 'V',
    chapterTitle: 'A Inversão do Critério',
    pageNumber: 44,
    paragraphs: [
      {
        before: 'Após internar quase todos os cidadãos de Itaguaí, Bacamarte reuniu a câmara para anunciar uma revolução em sua tese: ',
        highlight: {
          text: 'A loucura, até agora uma ilha perdida no oceano da razão, começo a suspeitar que é o próprio continente.',
          insight: 'A ironia máxima de Machado de Assis: a normalidade estatística se inverte e o equilíbrio passa a ser a verdadeira anomalia rara.',
          tags: ['ironia-machadiana', 'epistemologia', 'literatura-brasileira'],
          question: 'Qual é a virada conceitual de Bacamarte ao mudar seu critério de loucura?',
          answer: 'Ele conclui que se a imensa maioria dos homens possui desvios de caráter, a loucura é o estado natural e a perfeita razão é que constitui a verdadeira anomalia.'
        },
        after: ' Soltou portanto todos os loucos e internou apenas os raros cidadãos perfeitamente equilibrados.'
      },
      {
        text: 'A cidade suspirou aliviada, embora ninguém soubesse ao certo quem seria o próximo a exibir perfeição excessiva.'
      }
    ]
  }
]

const currentPageData = computed(() => {
  return demoPages[currentPageIndex.value] || demoPages[0]
})

const fontFamilyClass = computed(() => {
  switch (fontFamily.value) {
    case 'interface': return 'font-interface'
    case 'technical': return 'font-technical'
    default: return 'font-editorial'
  }
})

const themeClasses = computed(() => {
  if (readerTheme.value === 'sepia') {
    return {
      container: 'bg-[#FBF0D9] border-[#E8DCB8] text-[#2C241E]',
      header: 'border-[#E2D5B0] text-[#786652]',
      text: 'text-[#2C241E]',
      highlight: 'bg-[#E57B55]/20 text-[#1F1813] border-accent',
      navBtn: 'border-[#E2D5B0] text-[#2C241E] hover:bg-[#EFE3CA]'
    }
  }
  if (readerTheme.value === 'light') {
    return {
      container: 'bg-[#FFFFFF] border-gray-200 text-[#1A1A1A]',
      header: 'border-gray-200 text-gray-500',
      text: 'text-[#1A1A1A]',
      highlight: 'bg-amber-100 text-black border-amber-500',
      navBtn: 'border-gray-200 text-gray-800 hover:bg-gray-100'
    }
  }
  // Dark (Padrão)
  return {
    container: 'bg-[#0E0F12] border-divider text-textPrimary',
    header: 'border-divider text-textSecondary',
    text: 'text-textPrimary/95',
    highlight: 'bg-accent/20 text-white border-accent',
    navBtn: 'border-divider text-textPrimary hover:bg-white/10'
  }
})

const prevPage = () => {
  if (currentPageIndex.value > 0) {
    currentPageIndex.value--
    activeHighlight.value = null
  }
}

const nextPage = () => {
  if (currentPageIndex.value < demoPages.length - 1) {
    currentPageIndex.value++
    activeHighlight.value = null
  }
}

const handleHighlightClick = (hl: HighlightData) => {
  activeHighlight.value = hl
}

const openFlashcard = (hl: HighlightData) => {
  currentFlashcardData.value = {
    question: hl.question,
    answer: hl.answer
  }
  isFlashcardFlipped.value = false
  isFlashcardOpen.value = true
}

const handleAnswerFlashcard = (_level: string) => {
  isFlashcardOpen.value = false
}
</script>
