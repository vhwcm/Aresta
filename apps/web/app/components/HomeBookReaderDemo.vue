<template>
  <div
    data-testid="home-book-reader-demo"
    class="relative left-1/2 right-1/2 -mx-[50vw] w-screen px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-32 py-10 sm:py-16 transition-all duration-300 border-y border-divider/40"
    :class="themeClasses.wrapper"
  >
    <div class="max-w-[1600px] mx-auto flex flex-col gap-6 sm:gap-8">
      <!-- Topo: Título da Seção, Filosofia e Ação de Leitor Completo -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b" :class="themeClasses.border">
        <div class="flex flex-col gap-2 max-w-3xl">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-accent animate-pulse"></span>
            <span class="font-technical text-[11px] uppercase tracking-widest text-accent font-semibold">
              Santuário de Leitura · Demonstração em Tela Cheia
            </span>
          </div>
          <h2 class="font-editorial text-3xl sm:text-4xl lg:text-5xl font-light leading-tight" :class="themeClasses.heading">
            Experiência de Leitura Sem Bordas & Imersiva
          </h2>
          <p class="font-interface text-sm sm:text-base leading-relaxed" :class="themeClasses.subtext">
            Leia como em uma edição impressa de luxo: alterne entre modo página dupla ou simples, teste paletas de cor, interaja com destaques reflexivos e gere flashcards de retenção instantâneos.
          </p>
        </div>

        <!-- Barra de Controles Rápidos Flutuante -->
        <div class="flex items-center gap-3 flex-wrap lg:self-end">
          <!-- Seletor de Tema -->
          <div class="flex items-center p-1 rounded-2xl border" :class="themeClasses.controlsBg">
            <button
              @click="readerTheme = 'dark'"
              data-testid="theme-dark-btn"
              class="px-3 py-1.5 rounded-xl text-xs font-technical transition-all cursor-pointer"
              :class="readerTheme === 'dark' ? 'bg-accent text-white font-bold shadow-sm' : 'text-textSecondary hover:text-textPrimary'"
              title="Modo Noite"
            >
              Noite
            </button>
            <button
              @click="readerTheme = 'sepia'"
              data-testid="theme-sepia-btn"
              class="px-3 py-1.5 rounded-xl text-xs font-technical transition-all cursor-pointer"
              :class="readerTheme === 'sepia' ? 'bg-[#8C6D46] text-[#FFF9EE] font-bold shadow-sm' : 'text-textSecondary hover:text-textPrimary'"
              title="Modo Sépia"
            >
              Sépia
            </button>
            <button
              @click="readerTheme = 'light'"
              data-testid="theme-light-btn"
              class="px-3 py-1.5 rounded-xl text-xs font-technical transition-all cursor-pointer"
              :class="readerTheme === 'light' ? 'bg-accent text-white font-bold shadow-sm' : 'text-textSecondary hover:text-textPrimary'"
              title="Modo Claro"
            >
              Claro
            </button>
          </div>

          <!-- Seletor de Tipografia -->
          <div class="flex items-center p-1 rounded-2xl border" :class="themeClasses.controlsBg">
            <button
              @click="fontFamily = 'editorial'"
              class="px-3 py-1.5 rounded-xl text-xs font-editorial transition-all cursor-pointer"
              :class="fontFamily === 'editorial' ? 'bg-black/10 dark:bg-white/20 text-textPrimary font-semibold' : 'text-textSecondary hover:text-textPrimary'"
              title="Fonte Editorial Serifada"
            >
              Serif
            </button>
            <button
              @click="fontFamily = 'interface'"
              class="px-3 py-1.5 rounded-xl text-xs font-interface transition-all cursor-pointer"
              :class="fontFamily === 'interface' ? 'bg-black/10 dark:bg-white/20 text-textPrimary font-semibold' : 'text-textSecondary hover:text-textPrimary'"
              title="Fonte Sans-Serif Moderna"
            >
              Sans
            </button>
            <button
              @click="fontFamily = 'technical'"
              class="px-3 py-1.5 rounded-xl text-xs font-technical transition-all cursor-pointer"
              :class="fontFamily === 'technical' ? 'bg-black/10 dark:bg-white/20 text-textPrimary font-semibold' : 'text-textSecondary hover:text-textPrimary'"
              title="Fonte Monospaçada"
            >
              Mono
            </button>
          </div>

          <!-- Tamanho da Fonte -->
          <div class="flex items-center p-1 rounded-2xl border" :class="themeClasses.controlsBg">
            <button
              @click="fontSize = Math.max(14, fontSize - 1)"
              class="w-8 h-7 rounded-xl text-xs font-technical flex items-center justify-center text-textSecondary hover:text-textPrimary cursor-pointer"
              title="Diminuir fonte"
            >
              A-
            </button>
            <span class="text-xs font-technical px-2 text-accent font-semibold">{{ fontSize }}px</span>
            <button
              @click="fontSize = Math.min(22, fontSize + 1)"
              class="w-8 h-7 rounded-xl text-xs font-technical flex items-center justify-center text-textSecondary hover:text-textPrimary cursor-pointer"
              title="Aumentar fonte"
            >
              A+
            </button>
          </div>

          <!-- Alternador de Página Dupla / Simples (Desktop) -->
          <button
            @click="isDoublePage = !isDoublePage"
            class="hidden xl:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-technical transition-all cursor-pointer"
            :class="[themeClasses.controlsBg, isDoublePage ? 'text-accent border-accent/40' : 'text-textSecondary']"
            :title="isDoublePage ? 'Mudar para Página Simples' : 'Mudar para Página Dupla'"
          >
            <BookOpenIcon class="w-4 h-4" />
            <span>{{ isDoublePage ? 'Página Dupla' : 'Página Única' }}</span>
          </button>

          <!-- CTA Direto -->
          <NuxtLink
            to="/reader?book=/books/O-Alienista.epub&title=O%20Alienista"
            class="px-5 py-2.5 rounded-full bg-accent hover:bg-accent/90 text-white font-interface text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-accent/20 cursor-pointer shrink-0"
          >
            <span>Abrir no Leitor</span>
            <ArrowRightIcon class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>

      <!-- Stage Panorâmico do Livro Aberto (Sem Bordas Artificiais, Ocupando Todo o Espaço Horizontal) -->
      <div class="relative w-full py-4 select-text">
        <!-- Navegação Lateral Esquerda (Botão Flutuante) -->
        <button
          @click="prevSpread"
          :disabled="currentSpreadIndex === 0"
          aria-label="Páginas anteriores"
          class="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full border flex items-center justify-center text-lg sm:text-xl transition-all shadow-xl disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
          :class="themeClasses.floatingNav"
          title="Página Anterior (Seta Esquerda)"
        >
          ‹
        </button>

        <!-- Navegação Lateral Direita (Botão Flutuante) -->
        <button
          @click="nextSpread"
          :disabled="currentSpreadIndex === totalSpreads - 1"
          aria-label="Próximas páginas"
          class="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full border flex items-center justify-center text-lg sm:text-xl transition-all shadow-xl disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
          :class="themeClasses.floatingNav"
          title="Próxima Página (Seta Direita)"
        >
          ›
        </button>

        <!-- Grid de Páginas Abertas -->
        <div
          class="w-full grid gap-8 lg:gap-14 px-8 sm:px-14 md:px-16 transition-all duration-500"
          :class="isDoublePage ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 max-w-4xl mx-auto'"
        >
          <!-- PÁGINA ESQUERDA (OU PÁGINA ÚNICA) -->
          <article
            class="flex flex-col justify-between min-h-[460px] sm:min-h-[520px] transition-all"
            :class="[fontFamilyClass, themeClasses.article]"
          >
            <!-- Cabeçalho da Página Esquerda -->
            <div class="flex items-center justify-between pb-3 border-b text-xs font-technical tracking-widest uppercase opacity-75" :class="themeClasses.border">
              <span>Machado de Assis</span>
              <span>{{ currentLeftPage.chapterTitle }}</span>
              <span>Pág. {{ currentLeftPage.pageNumber }}</span>
            </div>

            <!-- Conteúdo Textual Rico da Página Esquerda -->
            <div class="py-6 flex flex-col gap-5 text-justify leading-relaxed" :style="{ fontSize: `${fontSize}px` }">
              <p v-for="(p, idx) in currentLeftPage.paragraphs" :key="idx" class="indent-6">
                <template v-if="p.highlight">
                  <span>{{ p.before }}</span>
                  <span
                    @click="handleHighlightClick(p.highlight)"
                    class="relative inline cursor-pointer px-1.5 py-0.5 rounded transition-all group/hl border-b-2 font-medium"
                    :class="themeClasses.highlight"
                    :title="'Clique para inspecionar anotação e gerar flashcard'"
                  >
                    <span>{{ p.highlight.text }}</span>
                    <SparklesIcon class="inline w-4 h-4 text-accent ml-1 -mt-0.5 opacity-80 group-hover/hl:opacity-100 group-hover/hl:scale-125 transition-transform" />
                  </span>
                  <span>{{ p.after }}</span>
                </template>
                <template v-else>
                  {{ p.text }}
                </template>
              </p>
            </div>

            <!-- Rodapé da Página Esquerda -->
            <div class="flex items-center justify-between pt-3 border-t text-[11px] font-technical opacity-60" :class="themeClasses.border">
              <span>O Alienista (1882)</span>
              <span>Capítulo {{ currentLeftPage.chapterNum }}</span>
            </div>
          </article>

          <!-- PÁGINA DIREITA (QUANDO EM MODO DUPLO NO DESKTOP) -->
          <article
            v-if="isDoublePage && currentRightPage"
            class="hidden xl:flex flex-col justify-between min-h-[460px] sm:min-h-[520px] transition-all border-l pl-14"
            :class="[fontFamilyClass, themeClasses.article, themeClasses.border]"
          >
            <!-- Cabeçalho da Página Direita -->
            <div class="flex items-center justify-between pb-3 border-b text-xs font-technical tracking-widest uppercase opacity-75" :class="themeClasses.border">
              <span>{{ currentRightPage.chapterTitle }}</span>
              <span>Edição Crítica Aresta</span>
              <span>Pág. {{ currentRightPage.pageNumber }}</span>
            </div>

            <!-- Conteúdo Textual Rico da Página Direita -->
            <div class="py-6 flex flex-col gap-5 text-justify leading-relaxed" :style="{ fontSize: `${fontSize}px` }">
              <p v-for="(p, idx) in currentRightPage.paragraphs" :key="idx" class="indent-6">
                <template v-if="p.highlight">
                  <span>{{ p.before }}</span>
                  <span
                    @click="handleHighlightClick(p.highlight)"
                    class="relative inline cursor-pointer px-1.5 py-0.5 rounded transition-all group/hl border-b-2 font-medium"
                    :class="themeClasses.highlight"
                    :title="'Clique para inspecionar anotação e gerar flashcard'"
                  >
                    <span>{{ p.highlight.text }}</span>
                    <SparklesIcon class="inline w-4 h-4 text-accent ml-1 -mt-0.5 opacity-80 group-hover/hl:opacity-100 group-hover/hl:scale-125 transition-transform" />
                  </span>
                  <span>{{ p.after }}</span>
                </template>
                <template v-else>
                  {{ p.text }}
                </template>
              </p>
            </div>

            <!-- Rodapé da Página Direita -->
            <div class="flex items-center justify-between pt-3 border-t text-[11px] font-technical opacity-60" :class="themeClasses.border">
              <span>Acervo Digital PKM</span>
              <span>Página {{ currentRightPage.pageNumber }} de 128</span>
            </div>
          </article>
        </div>

        <!-- Card Flutuante de Destaque e Reflexão Ativa -->
        <div
          v-if="activeHighlight"
          data-testid="highlight-popover"
          class="absolute bottom-6 left-8 right-8 sm:left-24 sm:right-24 z-30 p-5 sm:p-6 rounded-3xl bg-bgPanel border border-accent/50 shadow-2xl backdrop-blur-2xl text-textPrimary flex flex-col gap-3.5 animate-fadeIn max-w-4xl mx-auto"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-accent animate-pulse"></span>
              <span class="font-technical text-xs uppercase tracking-widest text-accent font-semibold">
                Anotação Reflexiva & Vínculo ao Grafo
              </span>
            </div>
            <button
              @click="activeHighlight = null"
              class="text-textSecondary hover:text-textPrimary p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <XIcon class="w-5 h-5" />
            </button>
          </div>

          <blockquote class="font-editorial italic text-sm sm:text-base text-textPrimary border-l-2 border-accent pl-4 leading-relaxed">
            "{{ activeHighlight.text }}"
          </blockquote>

          <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed pl-4">
            {{ activeHighlight.insight }}
          </p>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-divider/60 gap-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                v-for="tag in activeHighlight.tags"
                :key="tag"
                class="px-2.5 py-1 rounded-lg bg-accent/15 border border-accent/30 text-accent font-technical text-xs"
              >
                #{{ tag }}
              </span>
            </div>

            <button
              @click="openFlashcard(activeHighlight)"
              data-testid="generate-flashcard-btn"
              class="px-4 py-2 rounded-xl bg-accent text-white font-interface text-xs sm:text-sm font-semibold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-accent/20 cursor-pointer shrink-0"
            >
              <BrainIcon class="w-4 h-4" />
              <span>Gerar Flashcard de Retenção</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Barra Inferior de Navegação & Progresso Total da Demonstração -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t" :class="themeClasses.border">
        <!-- Indicador de Progresso em Porcentagem -->
        <div class="flex items-center gap-3 text-xs font-technical text-textSecondary">
          <span class="text-accent font-semibold">{{ currentProgressPercent }}% Concluído</span>
          <div class="w-32 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-accent transition-all duration-300" :style="{ width: `${currentProgressPercent}%` }"></div>
          </div>
          <span>{{ currentLeftPage.pageNumber }} de 128 páginas</span>
        </div>

        <!-- Seletor de Spreads / Capítulos -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <button
            v-for="(spread, sIdx) in spreads"
            :key="sIdx"
            @click="currentSpreadIndex = sIdx"
            class="px-3 py-1 rounded-xl text-xs font-technical border transition-all cursor-pointer"
            :class="currentSpreadIndex === sIdx ? 'bg-accent text-white border-accent font-bold' : 'bg-black/5 dark:bg-white/5 border-divider text-textSecondary hover:text-textPrimary'"
          >
            {{ spread.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal / Flipcard Interativo de Flashcard -->
    <div
      v-if="isFlashcardOpen"
      data-testid="flashcard-modal"
      class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      @click.self="isFlashcardOpen = false"
    >
      <div class="w-full max-w-lg rounded-3xl bg-bgPanel border border-accent/40 p-6 sm:p-8 flex flex-col gap-5 shadow-2xl relative text-left">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <BrainIcon class="w-5 h-5" />
            </div>
            <div>
              <span class="font-technical text-[10px] uppercase tracking-widest text-accent font-semibold">
                Repetição Espaçada Ebbinghaus
              </span>
              <h4 class="font-interface text-sm font-semibold text-textPrimary">
                Flashcard Criado a Partir da Leitura
              </h4>
            </div>
          </div>
          <button
            @click="isFlashcardOpen = false"
            class="p-2 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Card com Efeito Flip Interativo -->
        <div
          @click="isFlashcardFlipped = !isFlashcardFlipped"
          class="w-full min-h-[180px] p-6 rounded-2xl bg-black/[0.03] dark:bg-black/60 border border-divider hover:border-accent/50 transition-all flex flex-col justify-between cursor-pointer select-none group"
        >
          <div class="flex items-center justify-between">
            <span class="font-technical text-[10px] uppercase tracking-wider text-textSecondary">
              {{ isFlashcardFlipped ? 'Resposta Definitiva' : 'Pergunta Reflexiva (Clique no cartão para virar)' }}
            </span>
            <RotateCcwIcon class="w-4 h-4 text-accent group-hover:rotate-180 transition-transform duration-500" />
          </div>

          <p class="font-editorial text-base sm:text-lg text-textPrimary leading-relaxed py-4">
            {{ isFlashcardFlipped ? currentFlashcardData.answer : currentFlashcardData.question }}
          </p>

          <span class="font-technical text-[11px] text-accent">
            {{ isFlashcardFlipped ? '✓ Resposta revelada · Selecione a dificuldade:' : '💡 Clique para verificar sua recordação ativa' }}
          </span>
        </div>

        <!-- Botões de Intervalo de Repetição -->
        <div class="flex items-center justify-between pt-2 border-t border-divider/60 gap-2">
          <button
            @click="handleAnswerFlashcard('dificil')"
            class="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-interface text-xs hover:bg-rose-500/20 transition-all cursor-pointer font-medium"
          >
            Difícil (1 dia)
          </button>
          <button
            @click="handleAnswerFlashcard('bom')"
            class="flex-1 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-interface text-xs hover:bg-amber-500/20 transition-all cursor-pointer font-medium"
          >
            Bom (3 dias)
          </button>
          <button
            @click="handleAnswerFlashcard('facil')"
            class="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-interface text-xs hover:bg-emerald-500/20 transition-all cursor-pointer font-medium"
          >
            Fácil (7 dias)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  BookOpenIcon,
  SparklesIcon,
  BrainIcon,
  XIcon,
  RotateCcwIcon,
  ArrowRightIcon
} from 'lucide-vue-next'
import { useSettings } from '~/composables/useSettings'

const { themeMode } = useSettings()

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

interface DemoSpread {
  label: string
  leftPage: DemoPage
  rightPage: DemoPage
}

const readerTheme = ref<'dark' | 'sepia' | 'light'>(themeMode.value === 'dark' ? 'dark' : 'light')

watch(themeMode, (mode) => {
  if (readerTheme.value !== 'sepia') {
    readerTheme.value = mode
  }
})
const fontFamily = ref<'editorial' | 'interface' | 'technical'>('editorial')
const fontSize = ref(17)
const isDoublePage = ref(true)
const currentSpreadIndex = ref(0)
const activeHighlight = ref<HighlightData | null>(null)
const isFlashcardOpen = ref(false)
const isFlashcardFlipped = ref(false)
const currentFlashcardData = ref<{ question: string; answer: string }>({
  question: '',
  answer: ''
})

const spreads: DemoSpread[] = [
  {
    label: 'Cap. III: A Casa Verde',
    leftPage: {
      bookTitle: 'O Alienista',
      chapterNum: 'III',
      chapterTitle: 'A Casa Verde',
      pageNumber: 42,
      paragraphs: [
        {
          before: 'O ilustre médico declarou solenemente à vereança de Itaguaí que ',
          highlight: {
            text: 'a razão é a perfeita saúde da alma; a loucura é a alteração dessa saúde.',
            insight: 'Simão Bacamarte estabelece uma fronteira arbitrária entre sanidade e desvio, demonstrando o perigo do cientificismo desprovido de autocrítica.',
            tags: ['epistemologia', 'filosofia-da-mente', 'alienista'],
            question: 'Como Simão Bacamarte define a relação entre razão e loucura no início de sua pesquisa?',
            answer: 'Ele define a razão como o perfeito equilíbrio anímico e moral, tratando qualquer paixão desmedida ou virtude extravagante como indício de alteração patológica.'
          },
          after: ' E acrescentou que, assim como a medicina descobria as leis orgânicas do corpo, cumpria à psiquiatria codificar os desvios do espírito humano.'
        },
        {
          text: 'A vila inteira acolheu o projeto do asilo com entusiasmo e veneração. As famílias mais nobres aplaudiram a iniciativa, e a própria câmara municipal autorizou a imposição de um imposto especial sobre penachos e carruagens para custear o tratamento dos alienados.'
        },
        {
          text: 'Bacamarte passava os dias inteiros fechado em seu gabinete, debruçado sobre tratados árabes e compêndios latinos, buscando estabelecer uma fórmula matemática para classificar cada impulso moral dos cidadãos de Itaguaí.'
        }
      ]
    },
    rightPage: {
      bookTitle: 'O Alienista',
      chapterNum: 'III',
      chapterTitle: 'A Casa Verde',
      pageNumber: 43,
      paragraphs: [
        {
          before: 'Em conversa reservada com o boticário Crispim Soares, o médico expressou com frieza a sua dedicação inabalável: ',
          highlight: {
            text: 'A ciência é a minha esposa única, e a Casa Verde o meu laboratório.',
            insight: 'O isolamento do intelectual dogmático que substitui as relações humanas pela busca obsessiva de confirmação de suas hipóteses.',
            tags: ['cientificismo', 'psicologia', 'autoridade'],
            question: 'O que a dedicação de Bacamarte à ciência revela sobre sua psicologia?',
            answer: 'Revela uma renúncia completa aos afetos em nome de um ideal teórico absoluto, convertendo a sociedade ao seu redor em mero objeto de experimentação.'
          },
          after: ' Nada mais existia para ele no mundo fora daquele edifício de quatrocentos aposentos envidraçados.'
        },
        {
          text: 'Poucas semanas depois da inauguração, o critério de internação ampliou-se com uma rapidez estarrecedora. Não tardou para que o padre Lopes, o presidente da câmara e até a própria esposa do alienista, D. Evarista, fossem recolhidos sob diagnósticos de soberba e prodigalidade.'
        },
        {
          text: 'O pavor instalou-se na vila: quem cumprimentasse efusivamente um vizinho arriscava-se a ser classificado como maníaco expansivo; quem calasse em público era recolhido por melancolia perigosa.'
        }
      ]
    }
  },
  {
    label: 'Cap. IV: A Rebelião',
    leftPage: {
      bookTitle: 'O Alienista',
      chapterNum: 'IV',
      chapterTitle: 'A Rebelião dos Canjicas',
      pageNumber: 44,
      paragraphs: [
        {
          before: 'Diante do terror que assolava Itaguaí, o barbeiro Porfírio liderou a revolta popular contra o asilo: ',
          highlight: {
            text: 'A tirania da ciência é mais cruel que a tirania dos déspotas, pois veste a capa da caridade.',
            insight: 'Machado ilustra como o poder exercido em nome do bem supremo e do conhecimento técnico torna-se incontestável e imune à crítica.',
            tags: ['critica-social', 'poder', 'machado-de-assis'],
            question: 'Qual é o paradoxo da autoridade científica denunciado na revolta de Porfírio?',
            answer: 'A autoridade técnica se apresenta como imune à contestação política porque alega agir exclusivamente pelo progresso e pela saúde da sociedade.'
          },
          after: ' Uma multidão de trezentos homens armou-se de facões e marchou em direção à residência do alienista.'
        },
        {
          text: 'Simão Bacamarte recebeu os revoltosos na varanda de sua casa com serenidade cirúrgica. Não empalideceu, nem buscou refúgio; limitou-se a examinar as feições furiosas dos manifestantes com olhar clínico, anotando mentalmente os sintomas de histeria coletiva.'
        }
      ]
    },
    rightPage: {
      bookTitle: 'O Alienista',
      chapterNum: 'IV',
      chapterTitle: 'A Rebelião dos Canjicas',
      pageNumber: 45,
      paragraphs: [
        {
          before: 'Ao assumir o poder local, no entanto, Porfírio surpreendeu seus correligionários ao procurar o alienista em segredo: ',
          highlight: {
            text: 'O poder político não destrói a ciência; descobre nela o instrumento mais refinado de governo.',
            insight: 'A cooptação recíproca entre a burocracia governamental e as instituições de saber para a manutenção da ordem.',
            tags: ['sociologia', 'poder', 'epistemologia'],
            question: 'Por que o líder dos revoltosos se alia ao alienista após tomar o poder?',
            answer: 'Porque percebe que a estrutura de internação e classificação psiquiátrica constitui uma ferramenta indispensável para neutralizar opositores e manter o controle.'
          },
          after: ' E autorizou imediatamente a internação dos líderes dissidentes de seu próprio partido.'
        },
        {
          text: 'A Casa Verde passou então a abrigar tanto os derrotados quanto os vencedores, até que quase quatro quintos de toda a população de Itaguaí estivessem sob chave no manicômio.'
        }
      ]
    }
  },
  {
    label: 'Cap. V: A Inversão',
    leftPage: {
      bookTitle: 'O Alienista',
      chapterNum: 'V',
      chapterTitle: 'A Inversão do Critério',
      pageNumber: 46,
      paragraphs: [
        {
          before: 'Vendo toda a vila encarcerada, Simão Bacamarte submeteu seu próprio sistema a uma revisão epistemológica radical: ',
          highlight: {
            text: 'A loucura, até agora uma ilha perdida no oceano da razão, começo a suspeitar que é o próprio continente.',
            insight: 'A ironia máxima do conto machadiano: se a quase totalidade humana exibe desvios e contradições morais, o desequilíbrio é a norma biológica e o perfeito equilíbrio é a verdadeira aberração patológica.',
            tags: ['ironia-machadiana', 'epistemologia', 'literatura-brasileira'],
            question: 'Qual é a mudança conceitual realizada por Bacamarte ao mudar sua hipótese?',
            answer: 'Ele inverte a premissa fundamental: assume que o desvio é o estado natural da humanidade e que a perfeita virtude e coerência mental representam a anomalia a ser isolada.'
          },
          after: ' Decidiu então soltar imediatamente todos os alienados e recolher à Casa Verde apenas os espíritos de virtude intocável.'
        },
        {
          text: 'A vila inteira celebrou a libertação com foguetes e banquetes, maravilhada com a benevolência da nova teoria científica.'
        }
      ]
    },
    rightPage: {
      bookTitle: 'O Alienista',
      chapterNum: 'V',
      chapterTitle: 'O Isolamento Final',
      pageNumber: 47,
      paragraphs: [
        {
          before: 'Após meses examinando os raros homens perfeitos de Itaguaí e curando cada um de sua virtude excessiva, Bacamarte concluiu: ',
          highlight: {
            text: 'Só um indivíduo reúne em si a perfeita sagacidade e a perfeita moderação: eu mesmo.',
            insight: 'O solipsismo terminal do cientificista que, ao rejeitar toda a humanidade falível, conclui que apenas ele próprio é digno de internação perpétua.',
            tags: ['solipsismo', 'ironia', 'filosofia-da-mente'],
            question: 'Qual é o destino final de Simão Bacamarte?',
            answer: 'Ele se recolhe sozinho na Casa Verde para dedicar o resto de seus dias ao estudo e tratamento de si mesmo, como o único caso puro de perfeição moral.'
          },
          after: ' Entrou na Casa Verde, mandou fechar as portas de ferro atrás de si e entregou-se ao recolhimento perpétuo.'
        },
        {
          text: 'Diz a crônica da época que ali faleceu dezessete meses depois, em perfeito estado de equilíbrio e serenidade intelectual.'
        }
      ]
    }
  }
]

const totalSpreads = computed(() => spreads.length)

const fallbackPage = { bookTitle: '', chapterNum: '', chapterTitle: '', pageNumber: 1, paragraphs: [] }

const currentLeftPage = computed(() => {
  return spreads[currentSpreadIndex.value]?.leftPage || spreads[0]?.leftPage || fallbackPage
})

const currentRightPage = computed(() => {
  return spreads[currentSpreadIndex.value]?.rightPage || spreads[0]?.rightPage || fallbackPage
})

const currentProgressPercent = computed(() => {
  return Math.min(100, Math.round(((currentSpreadIndex.value + 1) / totalSpreads.value) * 100))
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
      wrapper: 'bg-[#FBF0D9] text-[#2C241E]',
      border: 'border-[#E8DCB8]',
      heading: 'text-[#2C241E]',
      subtext: 'text-[#786652]',
      controlsBg: 'bg-[#EFE3CA] border-[#E2D5B0] text-[#2C241E]',
      article: 'text-[#2C241E]',
      highlight: 'bg-[#E57B55]/25 text-[#1A130C] border-accent',
      floatingNav: 'bg-[#EFE3CA] border-[#E2D5B0] text-[#2C241E] hover:bg-[#E2D5B0] hover:text-accent'
    }
  }
  if (readerTheme.value === 'light') {
    return {
      wrapper: 'bg-[#FAFAFA] text-textPrimary',
      border: 'border-divider',
      heading: 'text-textPrimary',
      subtext: 'text-textSecondary',
      controlsBg: 'bg-bgPanel border-divider text-textPrimary',
      article: 'text-textPrimary',
      highlight: 'bg-amber-100 text-amber-950 border-amber-500',
      floatingNav: 'bg-bgPanel border-divider text-textSecondary hover:bg-black/5 hover:text-accent'
    }
  }
  // Dark (Modo Noite)
  return {
    wrapper: 'bg-[#0A0A0C] text-[#F2F2F2]',
    border: 'border-white/10',
    heading: 'text-[#FFFFFF]',
    subtext: 'text-[#A1A1AA]',
    controlsBg: 'bg-white/10 border-white/15 text-[#F2F2F2]',
    article: 'text-[#E4E4E7]',
    highlight: 'bg-accent/25 text-white border-accent',
    floatingNav: 'bg-black/80 border-white/15 text-[#A1A1AA] hover:text-white hover:border-accent/40'
  }
})

const prevSpread = () => {
  if (currentSpreadIndex.value > 0) {
    currentSpreadIndex.value--
    activeHighlight.value = null
  }
}

const nextSpread = () => {
  if (currentSpreadIndex.value < totalSpreads.value - 1) {
    currentSpreadIndex.value++
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
