<template>
  <div
    data-testid="home-canvas-notes-demo"
    class="w-full rounded-3xl bg-bgPanel border border-divider shadow-2xl p-4 sm:p-8 flex flex-col gap-6 relative overflow-hidden backdrop-blur-xl group hover:border-accent/40 transition-all duration-500"
  >
    <!-- Topo da Seção: Título, Filosofia de Retenção e Seletores -->
    <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-divider/60">
      <div class="flex flex-col gap-2 max-w-2xl">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-accent animate-pulse"></div>
          <span class="font-technical text-xs uppercase tracking-widest text-accent font-semibold flex items-center gap-1.5">
            <SparklesIcon class="w-3.5 h-3.5 text-accent" />
            Retenção de Conhecimento na Prática
          </span>
        </div>
        <h3 class="font-editorial text-2xl sm:text-3xl lg:text-4xl font-light text-textPrimary leading-tight">
          Do Livro à Maestria: <span class="text-accent italic font-normal">Notas Ativas & Canvas Espacial</span>
        </h3>
        <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
          Ler passivamente gera apenas ilusão de domínio. No Aresta, você extrai citações dos livros, sintetiza reflexões em notas nas suas próprias palavras e organiza ideias em um canvas infinito conectado — consolidando a retenção definitiva.
        </p>
      </div>

      <!-- Seletor de Cenários Interativos -->
      <div class="flex items-center gap-2 flex-wrap lg:self-end">
        <span class="font-technical text-[10px] uppercase tracking-wider text-textSecondary mr-1 hidden sm:inline">
          Exemplo:
        </span>
        <button
          v-for="scenario in scenarios"
          :key="scenario.id"
          @click="selectScenario(scenario.id)"
          :data-testid="`canvas-scenario-${scenario.id}`"
          class="px-3 py-1.5 rounded-xl font-technical text-xs transition-all cursor-pointer border flex items-center gap-1.5"
          :class="activeScenarioId === scenario.id
            ? 'bg-accent text-white border-accent shadow-md shadow-accent/20 font-semibold'
            : 'bg-black/5 dark:bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-black/10 dark:hover:bg-white/10'"
        >
          <span>{{ scenario.icon }}</span>
          <span>{{ scenario.label }}</span>
        </button>
      </div>
    </div>

    <!-- Pipeline Visual de 4 Etapas de Retenção (Clicáveis para focar nós) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
      <div
        v-for="(step, idx) in retentionSteps"
        :key="step.id"
        @click="activeStep = step.id"
        class="p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1 select-none"
        :class="activeStep === step.id
          ? 'bg-accent/10 border-accent/60 shadow-sm'
          : 'bg-black/[0.02] dark:bg-white/[0.02] border-divider hover:border-accent/30'"
      >
        <div class="flex items-center justify-between text-[10px] font-technical uppercase tracking-wider">
          <span :class="activeStep === step.id ? 'text-accent font-semibold' : 'text-textSecondary'">
            Etapa 0{{ idx + 1 }}
          </span>
          <span class="text-xs">{{ step.icon }}</span>
        </div>
        <div class="font-editorial text-sm font-light" :class="activeStep === step.id ? 'text-accent font-normal' : 'text-textPrimary'">
          {{ step.title }}
        </div>
        <p class="font-interface text-[11px] text-textSecondary line-clamp-2 leading-tight">
          {{ step.desc }}
        </p>
      </div>
    </div>

    <!-- Espaço de Demonstração Interativa: Canvas Espacial + Painel Lateral -->
    <div class="relative w-full rounded-2xl overflow-hidden bg-black/[0.03] dark:bg-black/50 border border-divider flex flex-col xl:flex-row h-[520px] sm:h-[580px]">
      <!-- Área do Canvas Espacial -->
      <div
        ref="canvasContainerRef"
        class="relative flex-1 h-full overflow-hidden select-none cursor-crosshair"
        @mousedown="handleCanvasMouseDown"
        @mousemove="handleCanvasMouseMove"
        @mouseup="handleCanvasMouseUp"
        @mouseleave="handleCanvasMouseUp"
        @touchstart.passive="handleTouchStart"
        @touchmove.passive="handleTouchMove"
        @touchend.passive="handleTouchEnd"
      >
        <!-- Grid de Fundo Espacial Sutil -->
        <div
          class="absolute inset-0 bg-grid-pattern bg-grid-size opacity-20 pointer-events-none transition-transform duration-75"
          :style="{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})` }"
        ></div>

        <!-- Camada SVG de Conexões com Linhas Curvas, Setas e Pulsos de Retenção -->
        <svg
          class="absolute inset-0 w-full h-full pointer-events-none"
          :style="{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`, transformOrigin: '0 0' }"
        >
          <defs>
            <marker
              id="arrow-accent"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" class="fill-accent" />
            </marker>
            <marker
              id="arrow-muted"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" class="fill-textSecondary/50" />
            </marker>
          </defs>

          <!-- Arestas / Conexões entre os nós -->
          <g v-for="edge in (currentScenario?.edges || [])" :key="edge.id">
            <path
              :d="computeCurvePath(edge.from, edge.to)"
              fill="none"
              :class="isEdgeHighlighted(edge) ? 'stroke-accent' : 'stroke-divider/80'"
              :stroke-width="isEdgeHighlighted(edge) ? '2.5' : '1.5'"
              :stroke-dasharray="edge.dashed ? '5,5' : 'none'"
              marker-end="url(#arrow-accent)"
            />
            <!-- Pulso mnemônico em movimento ao longo da aresta -->
            <circle
              v-if="isEdgeHighlighted(edge)"
              r="3.5"
              class="fill-accent animate-pulse"
              opacity="0.9"
            >
              <animateMotion
                :path="computeCurvePath(edge.from, edge.to)"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        </svg>

        <!-- Camada de Nós do Canvas (Arrastáveis e Clicáveis) -->
        <div
          class="absolute inset-0 pointer-events-none"
          :style="{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`, transformOrigin: '0 0' }"
        >
          <div
            v-for="node in (currentScenario?.nodes || [])"
            :key="node.id"
            @mousedown.stop="startDragNode($event, node)"
            @click.stop="selectNode(node)"
            class="absolute pointer-events-auto cursor-grab active:cursor-grabbing rounded-2xl shadow-xl transition-all duration-150 group/node"
            :class="[
              getNodeClasses(node),
              selectedNodeId === node.id ? 'ring-2 ring-accent scale-[1.02] shadow-2xl z-20' : 'hover:scale-[1.01] z-10'
            ]"
            :style="{
              left: `${node.x}px`,
              top: `${node.y}px`,
              width: `${node.width}px`
            }"
          >
            <!-- 1. TIPO: LIVRO / FONTE DA LEITURA -->
            <div v-if="node.type === 'book'" class="p-4 flex flex-col gap-2.5">
              <div class="flex items-center justify-between">
                <span class="font-technical text-[9px] uppercase tracking-wider text-accent font-semibold flex items-center gap-1.5">
                  <BookOpenIcon class="w-3.5 h-3.5 text-accent" />
                  Fonte de Leitura
                </span>
                <span class="font-technical text-[9px] text-textSecondary bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded">
                  EPUB
                </span>
              </div>
              <div>
                <h4 class="font-editorial text-base text-textPrimary leading-snug font-normal">
                  {{ node.title }}
                </h4>
                <span class="font-interface text-[11px] text-textSecondary">
                  {{ node.author }} · {{ node.chapter }}
                </span>
              </div>
              <div class="pt-2 border-t border-divider/50 flex items-center justify-between text-[10px] font-technical text-textSecondary">
                <span>Progresso: {{ node.progress }}%</span>
                <span class="text-accent hover:underline cursor-pointer flex items-center gap-1">
                  Ler livro →
                </span>
              </div>
            </div>

            <!-- 2. TIPO: CITAÇÃO / DESTAQUE EXTRAÍDO -->
            <div v-else-if="node.type === 'quote'" class="p-4 flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="font-technical text-[9px] uppercase tracking-wider text-amber-500 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <QuoteIcon class="w-3 h-3" />
                  Citação Destacada
                </span>
                <span class="font-technical text-[9px] text-textSecondary">Pág. {{ node.page }}</span>
              </div>
              <blockquote class="font-editorial text-xs sm:text-sm text-textPrimary italic border-l-2 border-amber-500 pl-2.5 leading-relaxed">
                "{{ node.text }}"
              </blockquote>
            </div>

            <!-- 3. TIPO: NOTA ATIVA / ELABORAÇÃO PESSOAL -->
            <div v-else-if="node.type === 'note'" class="p-4 flex flex-col gap-2.5">
              <div class="flex items-center justify-between">
                <span class="font-technical text-[9px] uppercase tracking-wider text-accent font-semibold flex items-center gap-1.5">
                  <FileTextIcon class="w-3.5 h-3.5 text-accent" />
                  Nota Ativa (Markdown)
                </span>
                <span class="font-technical text-[9px] px-2 py-0.5 rounded bg-accent/15 text-accent font-semibold">
                  Síntese
                </span>
              </div>
              <h5 class="font-editorial text-sm font-medium text-textPrimary">
                {{ node.title }}
              </h5>
              <p class="font-interface text-xs text-textSecondary leading-relaxed">
                {{ node.content }}
              </p>
              <div class="flex items-center gap-1.5 flex-wrap pt-1">
                <span
                  v-for="tag in node.tags"
                  :key="tag"
                  class="font-technical text-[9px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-textSecondary border border-divider"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- 4. TIPO: SÍNTESE ESPACIAL / MAPA MENTAL -->
            <div v-else-if="node.type === 'concept'" class="p-4 flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="font-technical text-[9px] uppercase tracking-wider text-emerald-500 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <LayersIcon class="w-3 h-3" />
                  Conexão Conceitual
                </span>
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <h5 class="font-editorial text-sm font-medium text-textPrimary">
                {{ node.title }}
              </h5>
              <p class="font-interface text-xs text-textSecondary leading-relaxed">
                {{ node.content }}
              </p>
            </div>

            <!-- 5. TIPO: FLASHCARD DE RETENÇÃO ESPAÇADA -->
            <div v-else-if="node.type === 'flashcard'" class="p-4 flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="font-technical text-[9px] uppercase tracking-wider text-accent font-semibold flex items-center gap-1">
                  <BrainIcon class="w-3.5 h-3.5 text-accent" />
                  Flashcard de Retenção
                </span>
                <span class="font-technical text-[9px] text-accent border border-accent/30 rounded px-1.5 py-0.5 bg-accent/10">
                  Repetição Espaçada
                </span>
              </div>
              <div class="font-editorial text-xs sm:text-sm text-textPrimary leading-snug">
                <strong>P:</strong> {{ node.question }}
              </div>
              <div
                v-if="revealedFlashcards[node.id]"
                class="font-interface text-xs text-textSecondary bg-black/5 dark:bg-white/5 p-2 rounded-xl border border-divider/60 mt-1 animate-in fade-in duration-200"
              >
                <strong>R:</strong> {{ node.answer }}
              </div>
              <button
                @click.stop="toggleFlashcard(node.id)"
                class="text-[10px] font-technical text-accent hover:underline text-left mt-0.5 flex items-center gap-1 cursor-pointer"
              >
                <span>{{ revealedFlashcards[node.id] ? 'Ocultar resposta' : 'Ver resposta da revisão →' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Controles Flutuantes do Canvas (Zoom e Reset) -->
        <div class="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-bgPanel/95 backdrop-blur-md border border-divider p-1.5 rounded-2xl shadow-xl">
          <button
            @click="handleZoomIn"
            title="Aumentar zoom do canvas"
            class="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 text-textPrimary flex items-center justify-center transition-colors text-sm font-bold cursor-pointer"
          >
            +
          </button>
          <button
            @click="handleZoomOut"
            title="Diminuir zoom do canvas"
            class="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 text-textPrimary flex items-center justify-center transition-colors text-sm font-bold cursor-pointer"
          >
            -
          </button>
          <button
            @click="handleResetCanvas"
            title="Resetar posição e escala"
            class="px-2.5 h-8 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 text-textSecondary hover:text-textPrimary flex items-center gap-1.5 transition-colors text-xs font-technical cursor-pointer"
          >
            <RotateCcwIcon class="w-3.5 h-3.5" />
            <span>Resetar</span>
          </button>
        </div>

        <!-- Dica de Interatividade no Canto Superior Esquerdo -->
        <div class="absolute top-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-bgPanel/90 backdrop-blur-md border border-divider text-[10px] font-technical text-textSecondary">
          <MoveIcon class="w-3 h-3 text-accent" />
          <span>Arraste os cartões e clique para inspecionar</span>
        </div>
      </div>

      <!-- Painel Lateral Explicativo: A Ciência da Retenção Ativa -->
      <div class="w-full xl:w-80 2xl:w-96 p-5 sm:p-6 bg-bgPanel/95 border-t xl:border-t-0 xl:border-l border-divider flex flex-col justify-between gap-4 overflow-y-auto">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between pb-3 border-b border-divider/60">
            <span class="font-technical text-[10px] uppercase tracking-wider text-accent font-semibold flex items-center gap-1.5">
              <CheckCircle2Icon class="w-3.5 h-3.5 text-accent" />
              Inspeção da Etapa
            </span>
            <span class="font-technical text-[9px] text-textSecondary px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">
              Neurociência
            </span>
          </div>

          <div v-if="selectedNode">
            <span class="font-technical text-[10px] uppercase tracking-wider text-accent">
              Elemento Selecionado:
            </span>
            <h4 class="font-editorial text-lg text-textPrimary leading-snug font-light mt-0.5">
              {{ selectedNode.title || selectedNode.type }}
            </h4>
            <div class="mt-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-divider text-xs font-interface text-textSecondary leading-relaxed">
              <strong class="text-textPrimary block mb-1">Impacto na Retenção:</strong>
              {{ selectedNode.cognitiveExplanation }}
            </div>
          </div>
          <div v-else>
            <h4 class="font-editorial text-base text-textPrimary font-light">
              Por que esta combinação retém o que você lê?
            </h4>
            <p class="font-interface text-xs text-textSecondary leading-relaxed mt-1">
              Clique em qualquer cartão no canvas para compreender a função neurológica de cada etapa: do grifo à consolidação mnemônica na memória de longo prazo.
            </p>
          </div>

          <!-- Métricas de Retenção Científica -->
          <div class="grid grid-cols-2 gap-2 pt-2">
            <div class="p-2.5 rounded-xl bg-accent/10 border border-accent/20 flex flex-col">
              <span class="font-technical text-base sm:text-lg font-bold text-accent">+80%</span>
              <span class="font-interface text-[10px] text-textSecondary leading-tight">Retenção com Notas + Flashcards</span>
            </div>
            <div class="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-divider flex flex-col">
              <span class="font-technical text-base sm:text-lg font-bold text-textPrimary">3x Mais</span>
              <span class="font-interface text-[10px] text-textSecondary leading-tight">Conexões entre Obras</span>
            </div>
          </div>
        </div>

        <!-- Ação para Experimentar o Canvas -->
        <div class="pt-3 border-t border-divider/60 flex flex-col gap-2">
          <NuxtLink
            to="/canvas?action=new"
            class="w-full py-2.5 px-4 rounded-xl bg-accent text-white font-interface text-xs font-semibold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-accent/20 cursor-pointer text-center"
          >
            <span>Experimentar Canvas & Notas</span>
            <ArrowRightIcon class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  SparklesIcon,
  BookOpenIcon,
  FileTextIcon,
  BrainIcon,
  LayersIcon,
  QuoteIcon,
  RotateCcwIcon,
  MoveIcon,
  CheckCircle2Icon,
  ArrowRightIcon
} from 'lucide-vue-next'

interface CanvasNodeItem {
  id: string
  type: 'book' | 'quote' | 'note' | 'concept' | 'flashcard'
  title?: string
  author?: string
  chapter?: string
  progress?: number
  page?: number
  text?: string
  content?: string
  tags?: string[]
  question?: string
  answer?: string
  x: number
  y: number
  width: number
  cognitiveExplanation: string
}

interface CanvasEdgeItem {
  id: string
  from: string
  to: string
  dashed?: boolean
}

interface ScenarioItem {
  id: string
  label: string
  icon: string
  nodes: CanvasNodeItem[]
  edges: CanvasEdgeItem[]
}

const scenarios: ScenarioItem[] = [
  {
    id: 'psicologia',
    label: 'Cognição & Decisão',
    icon: '🧠',
    nodes: [
      {
        id: 'book-1',
        type: 'book',
        title: 'Rápido e Devagar',
        author: 'Daniel Kahneman',
        chapter: 'Cap. 3: O Esforço Atencional',
        progress: 68,
        x: 30,
        y: 40,
        width: 250,
        cognitiveExplanation: 'O livro é o ponto de ancoragem factual. Manter o registro da fonte ativa a memória episódica contextual.'
      },
      {
        id: 'quote-1',
        type: 'quote',
        page: 47,
        text: 'A mente opera em dois sistemas: o Sistema 1 é automático e veloz; o Sistema 2 aloca atenção e esforço consciente.',
        x: 310,
        y: 35,
        width: 260,
        cognitiveExplanation: 'A extração precisa do texto protege contra falsas memórias e serve de alicerce para a reflexão própria.'
      },
      {
        id: 'note-1',
        type: 'note',
        title: 'Heurísticas e Fadiga Cognitiva',
        content: 'Quando o Sistema 2 cansa, o Sistema 1 assume o comando por atalhos. Por isso tomamos decisões impulsivas no fim do dia.',
        tags: ['#tomada-de-decisao', '#psicologia-cognitiva'],
        x: 180,
        y: 230,
        width: 270,
        cognitiveExplanation: 'Processamento Semântico Profundo: ao explicar a ideia com suas próprias palavras, a taxa de retenção sobe para mais de 75%.'
      },
      {
        id: 'concept-1',
        type: 'concept',
        title: 'Design de Rotinas de Alta Energia',
        content: 'Blindar manhãs para decisões críticas; deixar tarefas operacionais para a tarde.',
        x: 480,
        y: 220,
        width: 240,
        cognitiveExplanation: 'A síntese visual no canvas reduz a carga cognitiva e conecta a teoria diretamente com a aplicação prática na sua vida.'
      },
      {
        id: 'flashcard-1',
        type: 'flashcard',
        question: 'Qual a principal diferença operacional entre o Sistema 1 e o Sistema 2 de Kahneman?',
        answer: 'O Sistema 1 opera automaticamente e sem esforço consciente; o Sistema 2 exige atenção controlada e alocação de recursos deliberados.',
        x: 340,
        y: 380,
        width: 320,
        cognitiveExplanation: 'Efeito de Testagem (Testing Effect): tentar responder a uma pergunta antes de ver a resposta consolida as sinapses neuronais de longo prazo.'
      }
    ],
    edges: [
      { id: 'e1', from: 'book-1', to: 'quote-1' },
      { id: 'e2', from: 'quote-1', to: 'note-1' },
      { id: 'e3', from: 'note-1', to: 'concept-1' },
      { id: 'e4', from: 'note-1', to: 'flashcard-1', dashed: true }
    ]
  },
  {
    id: 'filosofia',
    label: 'Filosofia & Sanidade',
    icon: '🏛️',
    nodes: [
      {
        id: 'book-2',
        type: 'book',
        title: 'O Alienista',
        author: 'Machado de Assis',
        chapter: 'Cap. IV: A Teoria do Dr. Bacamarte',
        progress: 85,
        x: 30,
        y: 40,
        width: 250,
        cognitiveExplanation: 'Ler clássicos com foco expande a densidade lexical e exercita as redes de Teoria da Mente.'
      },
      {
        id: 'quote-2',
        type: 'quote',
        page: 42,
        text: 'A razão é a perfeita saúde da alma; a loucura é a alteração dessa saúde.',
        x: 310,
        y: 35,
        width: 260,
        cognitiveExplanation: 'Citação selecionada do leitor que desencadeia a investigação epistemológica no canvas.'
      },
      {
        id: 'note-2',
        type: 'note',
        title: 'A Arbitrariedade dos Critérios de Normalidade',
        content: 'Bacamarte define a razão por exclusão até internar 80% da vila. A certeza científica dogmática cega o observador.',
        tags: ['#epistemologia', '#literatura-brasileira'],
        x: 180,
        y: 230,
        width: 270,
        cognitiveExplanation: 'A elaboração crítica desenvolve o pensamento analítico e previne a aceitação cega de dogmas.'
      },
      {
        id: 'concept-2',
        type: 'concept',
        title: 'Crítica ao Cientificismo Extremado',
        content: 'Conexão direta com a epistemologia de Karl Popper sobre falseabilidade e limites da verdade científica.',
        x: 480,
        y: 220,
        width: 250,
        cognitiveExplanation: 'O Canvas Espacial permite cruzar autores de épocas diferentes em uma mesma tela conceitual.'
      },
      {
        id: 'flashcard-2',
        type: 'flashcard',
        question: 'Qual foi o dilema final de Simão Bacamarte sobre a Casa Verde?',
        answer: 'Concluiu que se a maioria possuía desvios morais, os únicos loucos eram os raros indivíduos íntegros — internando a si mesmo.',
        x: 340,
        y: 380,
        width: 320,
        cognitiveExplanation: 'Revisar o enredo através de perguntas fortalece o raciocínio dedutivo e a memorização duradoura.'
      }
    ],
    edges: [
      { id: 'e1', from: 'book-2', to: 'quote-2' },
      { id: 'e2', from: 'quote-2', to: 'note-2' },
      { id: 'e3', from: 'note-2', to: 'concept-2' },
      { id: 'e4', from: 'note-2', to: 'flashcard-2', dashed: true }
    ]
  },
  {
    id: 'sistemas',
    label: 'Estratégia & Antifragilidade',
    icon: '⚡',
    nodes: [
      {
        id: 'book-3',
        type: 'book',
        title: 'Antifrágil: Coisas que se Beneficiam do Caos',
        author: 'Nassim Nicholas Taleb',
        chapter: 'Livro I: O Antifrágil: Uma Introdução',
        progress: 42,
        x: 30,
        y: 40,
        width: 250,
        cognitiveExplanation: 'Absorver livros de alta densidade teórica requer pausas deliberadas para retenção ativa.'
      },
      {
        id: 'quote-3',
        type: 'quote',
        page: 19,
        text: 'A antifragilidade vai além da resiliência ou da robustez. O resiliente resiste a choques e permanece o mesmo; o antifrágil fica melhor.',
        x: 310,
        y: 35,
        width: 260,
        cognitiveExplanation: 'Registro verbatim do conceito central para evitar desvios semânticos.'
      },
      {
        id: 'note-3',
        type: 'note',
        title: 'Diferenciação: Robusto vs Antifrágil',
        content: 'O robusto apenas não quebra no choque; o antifrágil exige estressores controlados para se fortalecer (ex: músculos e aprendizado).',
        tags: ['#sistemas-complexos', '#estrategia'],
        x: 180,
        y: 230,
        width: 270,
        cognitiveExplanation: 'Criar analogias próprias no Markdown consolida a teoria na memória semântica.'
      },
      {
        id: 'concept-3',
        type: 'concept',
        title: 'Estratégia do Haltere (Barbell)',
        content: 'Combinação de 90% hiper-segurança com 10% de assimetria positiva máxima.',
        x: 480,
        y: 220,
        width: 240,
        cognitiveExplanation: 'Mapeamento visual no canvas conectando risco e inovação em projetos pessoais.'
      },
      {
        id: 'flashcard-3',
        type: 'flashcard',
        question: 'O que diferencia um sistema antifrágil de um sistema simplesmente robusto?',
        answer: 'O robusto apenas suporta estressores sem alterar sua estrutura; o antifrágil precisa do estresse e da volatilidade para crescer e melhorar.',
        x: 340,
        y: 380,
        width: 320,
        cognitiveExplanation: 'O flashcard automático garante que o conceito não seja esquecido 48h após a leitura do capítulo.'
      }
    ],
    edges: [
      { id: 'e1', from: 'book-3', to: 'quote-3' },
      { id: 'e2', from: 'quote-3', to: 'note-3' },
      { id: 'e3', from: 'note-3', to: 'concept-3' },
      { id: 'e4', from: 'note-3', to: 'flashcard-3', dashed: true }
    ]
  }
]

const activeScenarioId = ref('psicologia')
const activeStep = ref('step-2')
const selectedNodeId = ref<string>('note-1')
const revealedFlashcards = ref<Record<string, boolean>>({})

const zoomLevel = ref(0.95)
const panOffset = ref({ x: 10, y: 15 })

const isDraggingCanvas = ref(false)
const dragStartMouse = ref({ x: 0, y: 0 })
const dragStartPan = ref({ x: 0, y: 0 })

const isDraggingNode = ref(false)
const draggedNode = ref<CanvasNodeItem | null>(null)
const nodeDragStart = ref({ x: 0, y: 0, nodeX: 0, nodeY: 0 })

const retentionSteps = [
  { id: 'step-1', title: 'Leitura & Grifo', desc: 'Extração de citações no EPUB/PDF sem distração', icon: '📖' },
  { id: 'step-2', title: 'Nota Ativa', desc: 'Síntese em Markdown com suas próprias palavras', icon: '✍️' },
  { id: 'step-3', title: 'Canvas Espacial', desc: 'Organização visual e cruzamento de ideias', icon: '🗺️' },
  { id: 'step-4', title: 'Retenção Ebbinghaus', desc: 'Flashcard automático para memória permanente', icon: '🧠' }
]

const fallbackScenario: ScenarioItem = scenarios[0] as ScenarioItem

const currentScenario = computed<ScenarioItem>(() => {
  return scenarios.find((s) => s.id === activeScenarioId.value) || fallbackScenario
})

const selectedNode = computed(() => {
  const scenario = currentScenario.value || fallbackScenario
  return scenario.nodes.find((n) => n.id === selectedNodeId.value) || null
})

const selectScenario = (id: string) => {
  activeScenarioId.value = id
  revealedFlashcards.value = {}
  const scenario = currentScenario.value || fallbackScenario
  const firstNote = scenario.nodes.find((n) => n.type === 'note')
  selectedNodeId.value = firstNote?.id || scenario.nodes[0]?.id || ''
}

const selectNode = (node: CanvasNodeItem) => {
  selectedNodeId.value = node.id
}

const toggleFlashcard = (id: string) => {
  revealedFlashcards.value[id] = !revealedFlashcards.value[id]
}

const getNodeClasses = (node: CanvasNodeItem) => {
  switch (node.type) {
    case 'book':
      return 'bg-bgPanel border border-accent/40 bg-gradient-to-br from-accent/[0.04] to-transparent'
    case 'quote':
      return 'bg-bgPanel border border-amber-500/40 bg-amber-500/[0.03]'
    case 'note':
      return 'bg-bgPanel border border-accent/60 bg-accent/[0.04]'
    case 'concept':
      return 'bg-bgPanel border border-emerald-500/40 bg-emerald-500/[0.03]'
    case 'flashcard':
      return 'bg-bgPanel border border-accent/50 bg-gradient-to-br from-accent/[0.06] to-transparent'
    default:
      return 'bg-bgPanel border border-divider'
  }
}

const isEdgeHighlighted = (edge: CanvasEdgeItem) => {
  if (!selectedNodeId.value) return true
  return edge.from === selectedNodeId.value || edge.to === selectedNodeId.value
}

// Cálculo de curva suave Bezier entre os nós
const computeCurvePath = (fromId: string, toId: string) => {
  const scenario = currentScenario.value || fallbackScenario
  const fromNode = scenario.nodes.find((n) => n.id === fromId)
  const toNode = scenario.nodes.find((n) => n.id === toId)
  if (!fromNode || !toNode) return ''

  // Pontos de ancoragem
  const startX = fromNode.x + fromNode.width
  const startY = fromNode.y + 60
  const endX = toNode.x
  const endY = toNode.y + 60

  const dx = Math.abs(endX - startX) * 0.5
  return `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`
}

// Interações com o Canvas (Pan & Zoom)
const handleCanvasMouseDown = (e: MouseEvent) => {
  if (isDraggingNode.value) return
  isDraggingCanvas.value = true
  dragStartMouse.value = { x: e.clientX, y: e.clientY }
  dragStartPan.value = { ...panOffset.value }
}

const handleCanvasMouseMove = (e: MouseEvent) => {
  if (isDraggingNode.value && draggedNode.value) {
    const dx = (e.clientX - nodeDragStart.value.x) / zoomLevel.value
    const dy = (e.clientY - nodeDragStart.value.y) / zoomLevel.value
    draggedNode.value.x = Math.max(0, nodeDragStart.value.nodeX + dx)
    draggedNode.value.y = Math.max(0, nodeDragStart.value.nodeY + dy)
    return
  }

  if (isDraggingCanvas.value) {
    const dx = e.clientX - dragStartMouse.value.x
    const dy = e.clientY - dragStartMouse.value.y
    panOffset.value = {
      x: dragStartPan.value.x + dx,
      y: dragStartPan.value.y + dy
    }
  }
}

const handleCanvasMouseUp = () => {
  isDraggingCanvas.value = false
  isDraggingNode.value = false
  draggedNode.value = null
}

const startDragNode = (e: MouseEvent, node: CanvasNodeItem) => {
  isDraggingNode.value = true
  draggedNode.value = node
  selectedNodeId.value = node.id
  nodeDragStart.value = {
    x: e.clientX,
    y: e.clientY,
    nodeX: node.x,
    nodeY: node.y
  }
}

// Touch events para mobile
const handleTouchStart = (e: TouchEvent) => {
  const t = e.touches[0]
  if (e.touches.length === 1 && t) {
    isDraggingCanvas.value = true
    dragStartMouse.value = { x: t.clientX, y: t.clientY }
    dragStartPan.value = { ...panOffset.value }
  }
}

const handleTouchMove = (e: TouchEvent) => {
  const t = e.touches[0]
  if (isDraggingCanvas.value && e.touches.length === 1 && t) {
    const dx = t.clientX - dragStartMouse.value.x
    const dy = t.clientY - dragStartMouse.value.y
    panOffset.value = {
      x: dragStartPan.value.x + dx,
      y: dragStartPan.value.y + dy
    }
  }
}

const handleTouchEnd = () => {
  isDraggingCanvas.value = false
  isDraggingNode.value = false
}

const handleZoomIn = () => {
  zoomLevel.value = Math.min(1.4, zoomLevel.value + 0.1)
}

const handleZoomOut = () => {
  zoomLevel.value = Math.max(0.6, zoomLevel.value - 0.1)
}

const handleResetCanvas = () => {
  zoomLevel.value = 0.95
  panOffset.value = { x: 10, y: 15 }
}
</script>
