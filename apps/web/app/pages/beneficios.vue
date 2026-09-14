<template>
  <div class="flex flex-col gap-16 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto w-full px-4 sm:px-6">
    <!-- Barra Superior / Navegação de Retorno -->
    <div class="flex items-center justify-between pt-4">
      <NuxtLink
        to="/"
        data-testid="beneficios-back-link"
        class="inline-flex items-center gap-2 text-xs font-interface text-textSecondary hover:text-accent transition-colors group"
      >
        <ArrowLeftIcon class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Voltar ao Início</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <button
          type="button"
          data-testid="beneficios-open-feedback-btn"
          class="px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-divider hover:border-accent/40 text-textSecondary hover:text-accent text-xs font-interface transition-all cursor-pointer flex items-center gap-1.5"
          @click="isFeedbackOpen = true"
        >
          <MessageSquareIcon class="w-3.5 h-3.5" />
          <span>Enviar Sugestão</span>
        </button>
      </div>
    </div>

    <!-- Header Principal -->
    <header class="flex flex-col gap-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-accent flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
          Ecossistema Cognitivo · Arquitetura Aresta
        </div>
        <div class="flex items-center gap-3 text-textSecondary font-technical text-xs">
          <span class="flex items-center gap-1.5">
            <SparklesIcon class="w-3.5 h-3.5 text-accent" />
            Metodologia Científica
          </span>
          <span>·</span>
          <span class="flex items-center gap-1.5">
            <BrainIcon class="w-3.5 h-3.5 text-accent" />
            Retenção Permanente
          </span>
        </div>
      </div>

      <h1 class="font-editorial text-4xl sm:text-5xl md:text-6xl font-light text-textPrimary leading-[1.1]">
        Por que o Aresta transforma a forma como você <span class="text-accent italic font-normal">lê, pensa e retém</span>
      </h1>

      <!-- Hero Statement -->
      <div class="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-divider flex flex-col gap-4 backdrop-blur-xl relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-transparent opacity-40 group-hover:opacity-80 transition-opacity"></div>
        <p class="font-interface text-lg sm:text-xl text-textPrimary leading-relaxed relative z-10 font-light">
          A maioria das plataformas trata livros como texto estático e notas como arquivos isolados. O <strong class="font-semibold text-accent">Aresta</strong> foi concebido como um segundo cérebro sensorial: uma união harmoniosa entre neurociência da leitura, espacialização visual e algoritmos de retenção de longo prazo.
        </p>
        <p class="font-interface text-sm sm:text-base text-textSecondary leading-relaxed relative z-10">
          Descubra cada pilar arquitetado para resgatar sua atenção, aprofundar seu raciocínio crítico e garantir que o conhecimento absorvido permaneça com você para sempre.
        </p>
      </div>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- Grade de Pilares e Benefícios -->
    <main class="flex flex-col gap-16">

      <!-- Pilar 1: Leitura Sensorial & 3D Realista -->
      <section class="flex flex-col gap-6 group">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-technical font-bold text-sm">
            01
          </div>
          <div>
            <div class="font-technical text-[10px] uppercase tracking-widest text-accent font-semibold">
              Experiência Sensorial
            </div>
            <h2 class="font-editorial text-2xl sm:text-3xl font-light text-textPrimary group-hover:text-accent transition-colors">
              Leitura Imersiva & Virada de Página Tridimensional
            </h2>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <BookOpenIcon class="w-4 h-4" />
              </div>
              <h3 class="font-editorial text-xl font-light text-textPrimary">
                Física Realista de Folheamento (Three.js)
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                Ao invés de rolagens infinitas que cansam a visão e fragmentam a memória espacial, o leitor do Aresta simula a curvatura e a inércia de páginas reais de papel com aceleração por hardware.
              </p>
            </div>
            <div class="text-[11px] font-technical text-textSecondary/80 border-t border-divider/60 pt-3">
              ✦ Ancoragem topográfica da memória por quadrante da folha
            </div>
          </div>

          <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <SunIcon class="w-4 h-4" />
              </div>
              <h3 class="font-editorial text-xl font-light text-textPrimary">
                Tipografia Editorial & Iluminação Calibrada
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                Projetado com a fonte clássica <span class="font-editorial text-accent font-medium">Newsreader</span> e paletas dedicadas: modo Escuro profundo, Sépia amarelado de livro impresso e Claro suave, minimizando o cansaço ocular em sessões prolongadas.
              </p>
            </div>
            <div class="text-[11px] font-technical text-textSecondary/80 border-t border-divider/60 pt-3">
              ✦ Contraste harmônico para preservar o ciclo circadiano
            </div>
          </div>
        </div>
      </section>

      <!-- Pilar 2: Retenção Ativa & Curva de Ebbinghaus -->
      <section class="flex flex-col gap-6 group">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-technical font-bold text-sm">
            02
          </div>
          <div>
            <div class="font-technical text-[10px] uppercase tracking-widest text-accent font-semibold">
              Ciência Cognitiva
            </div>
            <h2 class="font-editorial text-2xl sm:text-3xl font-light text-textPrimary group-hover:text-accent transition-colors">
              Derrotando a Curva do Esquecimento com Spaced Repetition (FSRS)
            </h2>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <FlameIcon class="w-4 h-4" />
              </div>
              <h3 class="font-editorial text-xl font-light text-textPrimary">
                Algoritmo FSRS de Próxima Geração
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                O Aresta calcula matematicamente a estabilidade e a dificuldade de cada conceito. Você é provocado a revisar no instante exato antes de esquecer, multiplicando por até 5x a taxa de fixação em memória semântica.
              </p>
            </div>
            <div class="text-[11px] font-technical text-textSecondary/80 border-t border-divider/60 pt-3">
              ✦ Intervalos adaptativos baseados em evidência estatística
            </div>
          </div>

          <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <LayersIcon class="w-4 h-4" />
              </div>
              <h3 class="font-editorial text-xl font-light text-textPrimary">
                Flashcards Direto dos Destaques
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                Transforme qualquer trecho lido ou citação em flashcards interativos com 1 clique. O leitor conecta a pergunta de volta ao parágrafo original do livro para resgatar o contexto completo.
              </p>
            </div>
            <div class="text-[11px] font-technical text-textSecondary/80 border-t border-divider/60 pt-3">
              ✦ Recall ativo instantâneo sem fricção de digitação
            </div>
          </div>
        </div>
      </section>

      <!-- Pilar 3: Grafo de Conhecimento Espacial & Zettelkasten -->
      <section class="flex flex-col gap-6 group">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-technical font-bold text-sm">
            03
          </div>
          <div>
            <div class="font-technical text-[10px] uppercase tracking-widest text-accent font-semibold">
              Espacialização Mental
            </div>
            <h2 class="font-editorial text-2xl sm:text-3xl font-light text-textPrimary group-hover:text-accent transition-colors">
              Grafo Interdisciplinar & Método Zettelkasten
            </h2>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <NetworkIcon class="w-4 h-4" />
              </div>
              <h3 class="font-editorial text-xl font-light text-textPrimary">
                Navegação Radial de Ideias
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                Visualize seus livros, temas e notas interconectados em um mapa dinâmico em 2D. Descubra conexões inesperadas entre autores de séculos e disciplinas diferentes que você jamais notaria em pastas convencionais.
              </p>
            </div>
            <div class="text-[11px] font-technical text-textSecondary/80 border-t border-divider/60 pt-3">
              ✦ Simulação de forças gravitacionais D3 com atração magnética
            </div>
          </div>

          <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <FileTextIcon class="w-4 h-4" />
              </div>
              <h3 class="font-editorial text-xl font-light text-textPrimary">
                Notas Ativas Bidirecionais
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                Suas notas em Markdown conectam-se usando links compostos e referências diretas. Cada pensamento se torna um bloco reutilizável na construção do seu repertório intelectual.
              </p>
            </div>
            <div class="text-[11px] font-technical text-textSecondary/80 border-t border-divider/60 pt-3">
              ✦ Redução drástica do isolamento cognitivo da informação
            </div>
          </div>
        </div>
      </section>

      <!-- Pilar 4: Canvas Espacial Infinito & IA Didática -->
      <section class="flex flex-col gap-6 group">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-technical font-bold text-sm">
            04
          </div>
          <div>
            <div class="font-technical text-[10px] uppercase tracking-widest text-accent font-semibold">
              Síntese & Criação
            </div>
            <h2 class="font-editorial text-2xl sm:text-3xl font-light text-textPrimary group-hover:text-accent transition-colors">
              Canvas Infinito & Livretos Didáticos com Inteligência Artificial
            </h2>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <CompassIcon class="w-4 h-4" />
              </div>
              <h3 class="font-editorial text-xl font-light text-textPrimary">
                Quadro Espacial Livre
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                Posicione notas, diagramas, desenhos à mão livre e citações em um plano infinito. O pensamento espacial liberta a mente das restrições lineares dos editores de texto tradicionais.
              </p>
            </div>
            <div class="text-[11px] font-technical text-textSecondary/80 border-t border-divider/60 pt-3">
              ✦ Rejeição de palma e fluidez geométrica
            </div>
          </div>

          <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <SparklesIcon class="w-4 h-4" />
              </div>
              <h3 class="font-editorial text-xl font-light text-textPrimary">
                Livretos Didáticos Sintetizados por IA
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                Gere livretos conceituais e cadernos didáticos a partir de capítulos complexos. A IA atua como um preceptor socrático, estruturando premissas, exemplos práticos e testes diagnósticos.
              </p>
            </div>
            <div class="text-[11px] font-technical text-textSecondary/80 border-t border-divider/60 pt-3">
              ✦ Síntese pedagógica estruturada sem perda de rigor
            </div>
          </div>
        </div>
      </section>

      <!-- Resumo Comparativo: Aresta vs Leitores Tradicionais -->
      <section class="p-8 rounded-3xl bg-white/[0.02] border border-divider flex flex-col gap-6">
        <h3 class="font-editorial text-2xl font-light text-textPrimary text-center sm:text-left">
          Aresta vs Plataformas Tradicionais de Leitura
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full text-left font-interface text-xs sm:text-sm border-collapse">
            <thead>
              <tr class="border-b border-divider text-textSecondary font-technical text-[11px] uppercase tracking-wider">
                <th class="py-3 px-4">Critério</th>
                <th class="py-3 px-4 text-textSecondary/70">Leitores Comuns / PDFs</th>
                <th class="py-3 px-4 text-accent font-bold">Ecossistema Aresta</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-divider/40 text-textSecondary">
              <tr>
                <td class="py-3.5 px-4 font-medium text-textPrimary">Fixação do Conteúdo</td>
                <td class="py-3.5 px-4">Passiva (esquecimento de 80% em 7 dias)</td>
                <td class="py-3.5 px-4 text-accent font-medium">Repetição Espaçada FSRS & Recall Ativo</td>
              </tr>
              <tr>
                <td class="py-3.5 px-4 font-medium text-textPrimary">Sensação de Leitura</td>
                <td class="py-3.5 px-4">Scroll contínuo mecânico</td>
                <td class="py-3.5 px-4 text-accent font-medium">Virada de página 3D física e sensorial</td>
              </tr>
              <tr>
                <td class="py-3.5 px-4 font-medium text-textPrimary">Organização de Notas</td>
                <td class="py-3.5 px-4">Arquivos soltos ou gavetas estáticas</td>
                <td class="py-3.5 px-4 text-accent font-medium">Grafo de Conhecimento e Canvas Espacial</td>
              </tr>
              <tr>
                <td class="py-3.5 px-4 font-medium text-textPrimary">Assistência Cognitiva</td>
                <td class="py-3.5 px-4">Nenhuma ou resumos genéricos</td>
                <td class="py-3.5 px-4 text-accent font-medium">Livretos didáticos com rigor pedagógico</td>
              </tr>
              <tr>
                <td class="py-3.5 px-4 font-medium text-textPrimary">Hábito e Disciplina</td>
                <td class="py-3.5 px-4">Dependente apenas da força de vontade</td>
                <td class="py-3.5 px-4 text-accent font-medium">Ofensiva sustentável (Streaks) e foco diário</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- Componente Offcanvas de Feedback -->
    <FeedbackCanvas
      v-model:is-open="isFeedbackOpen"
      @close="isFeedbackOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  ArrowLeftIcon,
  MessageSquareIcon,
  SparklesIcon,
  BrainIcon,
  BookOpenIcon,
  SunIcon,
  FlameIcon,
  LayersIcon,
  NetworkIcon,
  FileTextIcon,
  CompassIcon
} from 'lucide-vue-next'
import FeedbackCanvas from '~/components/FeedbackCanvas.vue'

const isFeedbackOpen = ref(false)

if (typeof useHead === 'function') {
  useHead({
    title: 'Benefícios da Plataforma — Aresta Monolith',
    meta: [
      {
        name: 'description',
        content: 'Conheça todos os benefícios do Aresta: leitura imersiva 3D, retenção ativa com FSRS, Grafo de Conhecimento, Canvas Espacial e síntese didática por IA.'
      },
      {
        name: 'keywords',
        content: 'benefícios aresta, leitura ativa, retenção de conhecimento, spaced repetition, grafo de conhecimento, canvas espacial, fsrs'
      }
    ]
  })
}
</script>
