<template>
  <div>
    <!-- ESTADO 1: USUÁRIO AUTENTICADO (Home do Leitor / Leitura Ativa + Grafo em Telas Grandes na Metade Inteira sem Caixa) -->
    <div
      v-if="auth.isLoggedIn.value"
      data-testid="auth-home"
      class="w-full pb-20 animate-in fade-in duration-500 transition-all"
      :class="isGraphCollapsed ? 'max-w-3xl xl:max-w-4xl mx-auto' : 'grid grid-cols-1 xl:grid-cols-2 gap-8 2xl:gap-14 items-start'"
    >
      <!-- COLUNA PRINCIPAL: FEED DE LEITURA (Leitura Ativa, Flashcards e Anotações) -->
      <div class="w-full flex flex-col gap-9 2xl:gap-11">
        <!-- BLOCO 1: ÚLTIMA LEITURA ATIVA (Clean, sem caixa, capa clicável, ofensiva elevada no topo direito, progresso só em %) -->
        <section class="relative flex flex-row items-start gap-5 sm:gap-8 pt-1 sm:pt-2">
          <!-- Capa do Livro (Clicável diretamente no mobile e desktop) -->
          <NuxtLink
            :to="activeBookReaderLink"
            class="relative shrink-0 group/cover cursor-pointer select-none"
            :title="`Continuar leitura de ${activeBookTitle}`"
          >
            <div class="w-28 sm:w-36 md:w-40 xl:w-44 2xl:w-48 aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border border-divider hover:border-accent/50 bg-neutral-900 flex items-center justify-center relative transition-all duration-300 group-hover/cover:scale-[1.02]">
              <img
                v-if="activeBookCoverUrl && !coverError"
                :src="activeBookCoverUrl"
                :alt="activeBookTitle"
                @error="coverError = true"
                class="w-full h-full object-cover"
              />
              <!-- Fallback se imagem falhar -->
              <div v-else class="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-neutral-800 to-neutral-950 text-left border-l-2 border-accent">
                <span class="font-technical text-[9px] uppercase tracking-wider text-accent font-semibold">Aresta</span>
                <span class="font-editorial text-sm sm:text-base font-light text-white leading-tight line-clamp-3">{{ activeBookTitle }}</span>
                <span class="font-interface text-[10px] text-textSecondary">Machado de Assis</span>
              </div>

              <!-- Efeito de Lombada de Livro -->
              <div class="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/60 via-white/10 to-transparent pointer-events-none"></div>
            </div>
          </NuxtLink>

          <!-- Informações Compactas do Livro -->
          <div class="flex flex-col justify-between gap-3 sm:gap-4 flex-1 min-w-0">
            <div class="flex flex-col gap-1.5">
              <NuxtLink :to="activeBookReaderLink" class="hover:text-accent transition-colors">
                <h1 class="font-editorial text-2xl sm:text-4xl md:text-5xl 2xl:text-6xl font-light text-textPrimary leading-tight truncate sm:whitespace-normal">
                  {{ activeBookTitle }}
                </h1>
              </NuxtLink>

              <!-- Progresso Resumido: Apenas Porcentagem -->
              <div class="text-sm sm:text-base 2xl:text-lg font-technical text-accent font-semibold">
                {{ activeBookProgress }}%
              </div>
            </div>

            <!-- Botão de Ação: Continuar Leitura -->
            <div class="flex items-center gap-3 pt-1">
              <NuxtLink
                :to="activeBookReaderLink"
                class="bg-textPrimary text-bgApp font-interface text-sm sm:text-base font-medium px-5 sm:px-6 py-2.5 sm:py-3 rounded-full hover:opacity-90 transition-all flex items-center gap-2 shadow-md"
                title="Continuar Leitura"
              >
                <span>Continuar</span>
                <ArrowRightIcon class="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </NuxtLink>
            </div>
          </div>

          <!-- Ofensiva e Botão de Expandir Grafo no Topo Direito -->
          <div class="shrink-0 self-start -mt-2 sm:-mt-2.5 flex items-center gap-3">
            <button
              v-if="isGraphCollapsed"
              @click="toggleGraph"
              data-testid="toggle-graph-open-btn"
              class="hidden xl:inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-divider hover:border-accent/40 text-textSecondary hover:text-textPrimary text-xs sm:text-sm font-interface transition-all cursor-pointer shadow-sm"
              title="Expandir Grafo de Conhecimento"
            >
              <PanelRightOpenIcon class="w-4 h-4 text-accent" />
              <span>Mostrar Grafo</span>
            </button>
            <ReadingStreak />
          </div>
        </section>

        <div class="h-px bg-divider/60 w-full"></div>

        <!-- BLOCO 2: FLASHCARDS DO DIA (Clean, sem caixa, com botão direto) -->
        <section class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div class="font-technical text-xs sm:text-sm uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2.5">
              <BrainIcon class="w-4 h-4 text-accent" />
              Flashcards do Dia
            </div>

            <!-- Link com Ícone de Informação para Curva do Esquecimento -->
            <NuxtLink
              to="/curva-do-esquecimento"
              class="font-interface text-xs sm:text-sm font-medium text-accent hover:underline flex items-center gap-1.5 transition-colors"
              title="Entenda a Curva do Esquecimento de Hermann Ebbinghaus"
            >
              <InfoIcon class="w-4 h-4 text-accent" />
              <span>Por que revisar?</span>
            </NuxtLink>
          </div>

          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
            <div class="flex flex-col gap-2 flex-1">
              <span class="font-technical text-xs sm:text-sm text-accent uppercase font-semibold tracking-wider">
                1º Flashcard de Hoje · {{ dailyFlashcard.chapter }}
              </span>
              <h3 class="font-editorial text-xl sm:text-2xl 2xl:text-3xl font-light text-textPrimary leading-relaxed">
                {{ dailyFlashcard.question }}
              </h3>
            </div>

            <NuxtLink
              to="/revisao"
              class="bg-accent hover:bg-accent/90 text-white font-interface text-sm sm:text-base font-medium px-5 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all flex items-center gap-2 shadow-md shrink-0"
            >
              <span>Fazer Flashcard</span>
            </NuxtLink>
          </div>
        </section>

        <div class="h-px bg-divider/60 w-full"></div>

        <!-- BLOCO 3: ANOTAÇÕES DO ÚLTIMO LIVRO (Clean, sem caixa, 3 anotações) -->
        <section class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div class="font-technical text-xs sm:text-sm uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2.5">
              <FileTextIcon class="w-4 h-4 text-accent" />
              Anotações & Destaques
            </div>
            <NuxtLink to="/revisao" class="font-technical text-xs sm:text-sm font-medium text-accent hover:underline flex items-center gap-1">
              Ver todas →
            </NuxtLink>
          </div>

          <div class="flex flex-col divide-y divide-divider/40">
            <div
              v-for="note in activeBookNotes"
              :key="note.id"
              class="flex flex-col gap-2.5 py-4 first:pt-0 last:pb-0"
            >
              <div class="flex items-center justify-between text-xs sm:text-sm">
                <span class="font-technical text-xs sm:text-sm uppercase font-semibold tracking-widest text-accent">
                  {{ note.chapter }} · Pág. {{ note.page }}
                </span>
                <span class="font-technical text-xs sm:text-sm text-textSecondary">{{ note.date }}</span>
              </div>

              <blockquote class="border-l-2 border-accent pl-3.5 text-sm sm:text-base 2xl:text-lg font-interface italic text-textPrimary/90 leading-relaxed">
                "{{ note.quote }}"
              </blockquote>

              <p class="font-interface text-xs sm:text-sm 2xl:text-base text-textSecondary leading-relaxed pl-3.5">
                {{ note.insight }}
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- COLUNA LATERAL: GRAFO DE CONHECIMENTO (Metade Inteira na Home, Sem Caixa) -->
      <div
        v-if="!isGraphCollapsed"
        data-testid="home-graph-section"
        class="hidden xl:flex sticky top-8 flex-col gap-3.5 h-[calc(100vh-6.5rem)] min-h-[660px] 2xl:min-h-[760px] w-full"
      >
        <div class="flex items-center justify-between px-1">
          <div class="font-technical text-xs sm:text-sm uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2.5">
            <NetworkIcon class="w-4 h-4 text-accent" />
            <span>Grafo de Conhecimento</span>
          </div>

          <div class="flex items-center gap-3">
            <!-- Botão Retrair Grafo -->
            <button
              @click="toggleGraph"
              data-testid="retract-graph-btn"
              class="inline-flex items-center gap-1.5 text-xs sm:text-sm text-textSecondary hover:text-textPrimary font-interface transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-divider"
              title="Retrair Grafo e centralizar painel de leitura"
            >
              <PanelRightCloseIcon class="w-4 h-4 text-accent" />
              <span>Retrair</span>
            </button>

            <!-- Link Tela Cheia -->
            <NuxtLink to="/grafo" class="font-technical text-xs sm:text-sm font-medium text-accent hover:underline flex items-center gap-1" title="Ver grafo em tela cheia">
              <span>Expandir →</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Renderização Direta do Grafo (Sem Caixa) -->
        <div class="flex-1 w-full h-full relative overflow-hidden">
          <SidebarGraph />
        </div>
      </div>
    </div>

    <!-- ESTADO 2: VISITANTE NÃO AUTENTICADO (Página Inicial Pública / Landing Page do Aresta) -->
    <div v-else data-testid="guest-landing" class="flex flex-col gap-16 md:gap-24 py-6 md:py-10 animate-in fade-in duration-500 max-w-6xl mx-auto w-full">
      <!-- 1. SEÇÃO HERO DA LANDING PAGE (LAYOUT ESTRUTURADO EM 2 COLUNAS) -->
      <header class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-2 md:pt-6">
        <!-- Coluna da Esquerda: Textos, Chamada Principal e CTAs -->
        <div class="lg:col-span-7 flex flex-col items-start text-left gap-5">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/30 font-technical text-[10px] sm:text-[11px] uppercase tracking-widest text-accent font-semibold shadow-sm">
            <SparklesIcon class="w-3.5 h-3.5" />
            <span>Segundo Cérebro & Leitura Profunda · Minimalista & Anti-Dopaminérgico</span>
          </div>

          <h1 class="font-editorial text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-textPrimary leading-[1.12]">
            Transforme sua leitura em uma <span class="text-accent italic font-normal">rede viva</span> de conhecimento e competência.
          </h1>

          <p class="font-interface text-sm sm:text-base md:text-lg text-textSecondary max-w-xl leading-relaxed">
            O <strong>Aresta</strong> é um ecossistema minimalista e calmo para leitura imersiva de EPUB e PDF, anotações ativas e mapeamento visual de conexões. Desenvolvido para quem estuda, quer se tornar especialista em sua área ou dominar novos interesses — com foco contínuo, sem feeds viciantes e com retenção definitiva.
          </p>

          <!-- Botões de Ação Hero (CTAs de Alto Impacto) -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1 w-full sm:w-auto">
            <NuxtLink
              to="/login"
              class="bg-textPrimary text-bgApp font-interface text-sm sm:text-base font-semibold px-7 py-3.5 rounded-full hover:opacity-90 transition-all flex items-center justify-center gap-2.5 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Experimentar o Aresta Gratuitamente</span>
              <ArrowRightIcon class="w-4 h-4 text-bgApp" />
            </NuxtLink>

            <NuxtLink
              to="/por-que-ler"
              class="px-6 py-3.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-divider hover:border-accent/40 text-textPrimary font-interface text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <BrainIcon class="w-4 h-4 text-accent" />
              <span>Por que Leitura Profunda?</span>
            </NuxtLink>
          </div>

          <!-- Micro-benefícios / Selos de Valor em Grade Estruturada -->
          <div class="grid grid-cols-2 gap-2.5 pt-3 w-full max-w-xl">
            <div class="flex items-center gap-2.5 text-xs font-technical text-textSecondary bg-black/[0.02] dark:bg-white/[0.02] border border-divider/60 rounded-xl px-3.5 py-2.5">
              <ZapOffIcon class="w-3.5 h-3.5 text-accent shrink-0" />
              <span>100% Anti-dopaminérgico</span>
            </div>
            <div class="flex items-center gap-2.5 text-xs font-technical text-textSecondary bg-black/[0.02] dark:bg-white/[0.02] border border-divider/60 rounded-xl px-3.5 py-2.5">
              <NetworkIcon class="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Segundo Cérebro</span>
            </div>
            <div class="flex items-center gap-2.5 text-xs font-technical text-textSecondary bg-black/[0.02] dark:bg-white/[0.02] border border-divider/60 rounded-xl px-3.5 py-2.5">
              <BookOpenIcon class="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Leitor EPUB & PDF</span>
            </div>
            <div class="flex items-center gap-2.5 text-xs font-technical text-textSecondary bg-black/[0.02] dark:bg-white/[0.02] border border-divider/60 rounded-xl px-3.5 py-2.5">
              <TargetIcon class="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Retenção & Maestria</span>
            </div>
          </div>
        </div>

        <!-- Coluna da Direita: Card Estruturado de Demonstração / Preview Visual do Santuário de Leitura -->
        <div class="lg:col-span-5 flex flex-col justify-center">
          <div class="rounded-3xl bg-bgPanel border border-divider p-6 sm:p-7 shadow-2xl backdrop-blur-xl flex flex-col gap-5 relative overflow-hidden group hover:border-accent/40 transition-all duration-500">
            <!-- Barra Superior do Card -->
            <div class="flex items-center justify-between pb-3 border-b border-divider/60">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-black/10 dark:bg-white/10"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-black/10 dark:bg-white/10"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-black/10 dark:bg-white/10"></span>
                <span class="font-technical text-[10px] uppercase tracking-wider text-textSecondary ml-1.5 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sessão Ativa · Foco Calmo
                </span>
              </div>
              <ArestaLogoGraph :size="24" :to="null" />
            </div>

            <!-- Excerpt de Leitura com Destaque Ativo -->
            <div class="p-4 rounded-2xl bg-black/[0.03] dark:bg-black/40 border border-divider flex flex-col gap-2.5">
              <div class="flex items-center justify-between">
                <span class="font-technical text-[10px] text-accent font-semibold uppercase tracking-wider">
                  Machado de Assis · O Alienista
                </span>
                <span class="font-technical text-[10px] text-textSecondary">Pág. 42</span>
              </div>
              <blockquote class="font-editorial text-sm sm:text-base text-textPrimary italic border-l-2 border-accent pl-3 leading-relaxed">
                "A razão é a perfeita saúde da alma; a loucura é a alteração dessa saúde."
              </blockquote>
              <p class="font-interface text-[11px] text-textSecondary pl-3 leading-snug">
                Fronteira arbitrária entre sanidade e desvio. Observação clínica do comportamento.
              </p>
            </div>

            <!-- Nós do Grafo Interconectados -->
            <div class="flex flex-col gap-2">
              <div class="font-technical text-[10px] uppercase tracking-wider text-textSecondary flex items-center gap-1.5">
                <NetworkIcon class="w-3.5 h-3.5 text-accent" />
                <span>Nós Conectados no Grafo</span>
              </div>
              <div class="flex items-center gap-2 flex-wrap text-[10px] font-technical">
                <span class="px-2.5 py-1 rounded-lg bg-accent/15 border border-accent/30 text-accent font-medium">
                  #epistemologia
                </span>
                <span class="text-textSecondary/60">⇄</span>
                <span class="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-divider text-textSecondary">
                  #filosofia-da-mente
                </span>
                <span class="text-textSecondary/60">⇄</span>
                <span class="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-divider text-textSecondary">
                  #psicologia
                </span>
              </div>
            </div>

            <!-- Mini Flashcard de Retenção Ativa -->
            <div class="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-divider flex items-center justify-between gap-3">
              <div class="flex flex-col gap-0.5">
                <span class="font-technical text-[9px] uppercase tracking-widest text-accent font-semibold flex items-center gap-1">
                  <BrainIcon class="w-3 h-3 text-accent" />
                  Flashcard de Retenção
                </span>
                <span class="font-interface text-xs text-textPrimary line-clamp-1">
                  Critério de Bacamarte para a Casa Verde?
                </span>
              </div>
              <span class="shrink-0 font-interface text-[10px] font-medium text-white px-3 py-1 rounded-full bg-accent/80 shadow-sm">
                Revisar
              </span>
            </div>
          </div>
        </div>
      </header>

      <!-- 2. DEMONSTRAÇÕES INTERATIVAS AO VIVO: LEITOR IMERSIVO & GRAFO DE CONHECIMENTO -->
      <section class="flex flex-col gap-12 sm:gap-16">
        <!-- Demonstração Interativa do Leitor de Livro -->
        <HomeBookReaderDemo />

        <!-- Exemplo Interativo do Grafo de Conhecimento -->
        <HomeKnowledgeGraphDemo />
      </section>

      <!-- 3. SEÇÃO CIENTÍFICA I: OS BENEFÍCIOS DA LEITURA PROFUNDA & RACIOCÍNIO (NEUROCIÊNCIA) -->
      <section id="beneficios-leitura" class="flex flex-col gap-10 scroll-mt-10">
        <div class="flex flex-col items-start text-left gap-3 max-w-3xl">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-technical text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold shadow-sm">
            <MicroscopeIcon class="w-3.5 h-3.5" />
            <span>Neurociência Cognitiva & Pesquisas Científicas</span>
          </div>
          <h2 class="font-editorial text-3xl sm:text-4xl md:text-5xl font-light text-textPrimary leading-[1.15]">
            Por que a leitura profunda molda a <span class="text-accent italic font-normal">arquitetura do seu raciocínio</span>
          </h2>
          <p class="font-interface text-sm sm:text-base text-textSecondary leading-relaxed">
            Ao contrário do consumo efêmero de feeds digitais que estimulam o modo de escaneamento superficial, a leitura de textos densos e livros recruta circuitos cerebrais sofisticados. A neurociência contemporânea comprova ganhos estruturais na massa cinzenta, na capacidade dedutiva e na regulação emocional.
          </p>
        </div>

        <!-- Grade de Benefícios Científicos da Leitura -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <!-- Benefício 1: Raciocínio Lógico & Pensamento Crítico -->
          <div class="p-7 rounded-3xl bg-white/[0.02] border border-divider hover:border-accent/40 transition-all duration-300 flex flex-col justify-between gap-5 group">
            <div class="flex flex-col gap-3.5">
              <div class="flex items-center justify-between">
                <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                  <LightbulbIcon class="w-5 h-5" />
                </div>
                <span class="font-technical text-[9px] uppercase tracking-wider text-accent font-semibold px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20">
                  Stanford University
                </span>
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary group-hover:text-accent transition-colors">
                Raciocínio Lógico & Pensamento Crítico
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                Acompanhar teses extensas e argumentos dedutivos exercita o córtex pré-frontal dorsolateral. A decodificação sequencial treina a mente a identificar falácias, sustentar hipóteses e estruturar silogismos complexos com rigor analítico.
              </p>
            </div>
            <div class="pt-3 border-t border-divider/60 flex flex-col gap-1">
              <span class="font-technical text-[10px] text-textSecondary/80 uppercase tracking-wider">Evidência Científica:</span>
              <p class="font-interface text-[11px] text-textSecondary italic">
                Drª Maryanne Wolf (Stanford & Tufts): A leitura profunda conecta circuitos hemisféricos bidirecionais essenciais para o pensamento analítico.
              </p>
            </div>
          </div>

          <!-- Benefício 2: Neuroplasticidade & Conectividade Neural -->
          <div class="p-7 rounded-3xl bg-white/[0.02] border border-divider hover:border-accent/40 transition-all duration-300 flex flex-col justify-between gap-5 group">
            <div class="flex flex-col gap-3.5">
              <div class="flex items-center justify-between">
                <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BrainIcon class="w-5 h-5" />
                </div>
                <span class="font-technical text-[9px] uppercase tracking-wider text-accent font-semibold px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20">
                  Emory University (fMRI)
                </span>
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary group-hover:text-accent transition-colors">
                Neuroplasticidade & Conectividade Expandida
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                Estudos com ressonância magnética funcional revelam que a imersão em narrativas e livros densos eleva a conectividade de repouso no córtex temporal esquerdo e no sulco motor, criando um estado de prontidão cognitiva persistente por dias.
              </p>
            </div>
            <div class="pt-3 border-t border-divider/60 flex flex-col gap-1">
              <span class="font-technical text-[10px] text-textSecondary/80 uppercase tracking-wider">Evidência Científica:</span>
              <p class="font-interface text-[11px] text-textSecondary italic">
                Dr. Gregory Berns (Brain Connectivity, 2013): A leitura imersiva provoca alterações mensuráveis e duradouras nas redes somatossensoriais.
              </p>
            </div>
          </div>

          <!-- Benefício 3: Reserva Cognitiva & Longevidade -->
          <div class="p-7 rounded-3xl bg-white/[0.02] border border-divider hover:border-accent/40 transition-all duration-300 flex flex-col justify-between gap-5 group">
            <div class="flex flex-col gap-3.5">
              <div class="flex items-center justify-between">
                <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheckIcon class="w-5 h-5" />
                </div>
                <span class="font-technical text-[9px] uppercase tracking-wider text-accent font-semibold px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20">
                  Neurology · 32% Proteção
                </span>
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary group-hover:text-accent transition-colors">
                Reserva Cognitiva & Blindagem Cerebral
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                O hábito de leitura ao longo da vida atua como uma barreira protetora contra o envelhecimento celular, estimulando a sinaptogênese e preservando a flexibilidade mental mesmo em fases avançadas da vida adulta.
              </p>
            </div>
            <div class="pt-3 border-t border-divider/60 flex flex-col gap-1">
              <span class="font-technical text-[10px] text-textSecondary/80 uppercase tracking-wider">Evidência Científica:</span>
              <p class="font-interface text-[11px] text-textSecondary italic">
                Rush University Medical Center (Dr. Robert S. Wilson): Leitores assíduos apresentaram taxa de declínio cognitivo 32% mais lenta.
              </p>
            </div>
          </div>

          <!-- Benefício 4: Teoria da Mente & Empatia Cognitiva -->
          <div class="p-7 rounded-3xl bg-white/[0.02] border border-divider hover:border-accent/40 transition-all duration-300 flex flex-col justify-between gap-5 group">
            <div class="flex flex-col gap-3.5">
              <div class="flex items-center justify-between">
                <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CompassIcon class="w-5 h-5" />
                </div>
                <span class="font-technical text-[9px] uppercase tracking-wider text-accent font-semibold px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20">
                  Science Magazine
                </span>
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary group-hover:text-accent transition-colors">
                Teoria da Mente & Inteligência Social
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                Ler obras com múltiplos pontos de vista ativa as redes neuronais de Teoria da Mente (ToM), refinando a capacidade de decodificar intenções complexas, antecipar reações humanas e tomar decisões em ambientes sociais de alta incerteza.
              </p>
            </div>
            <div class="pt-3 border-t border-divider/60 flex flex-col gap-1">
              <span class="font-technical text-[10px] text-textSecondary/80 uppercase tracking-wider">Evidência Científica:</span>
              <p class="font-interface text-[11px] text-textSecondary italic">
                Kidd & Castano (Science, 2013 / Univ. de Toronto): A leitura profunda expande a sensibilidade empática e a acurácia na inferência de estados mentais.
              </p>
            </div>
          </div>

          <!-- Benefício 5: Redução de Estresse & Foco Calmo -->
          <div class="p-7 rounded-3xl bg-white/[0.02] border border-divider hover:border-accent/40 transition-all duration-300 flex flex-col justify-between gap-5 group">
            <div class="flex flex-col gap-3.5">
              <div class="flex items-center justify-between">
                <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                  <HeartPulseIcon class="w-5 h-5" />
                </div>
                <span class="font-technical text-[9px] uppercase tracking-wider text-accent font-semibold px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20">
                  Sussex Univ. · 68% Alívio
                </span>
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary group-hover:text-accent transition-colors">
                Desaceleração Fisiológica do Estresse
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                Apenas 6 minutos de leitura concentrada em ambiente sem distrações desaceleram os batimentos cardíacos e diminuem a tensão muscular, ativando o sistema nervoso parassimpático e restabelecendo o foco atencional.
              </p>
            </div>
            <div class="pt-3 border-t border-divider/60 flex flex-col gap-1">
              <span class="font-technical text-[10px] text-textSecondary/80 uppercase tracking-wider">Evidência Científica:</span>
              <p class="font-interface text-[11px] text-textSecondary italic">
                Dr. David Lewis (Mindlab / University of Sussex): Ler em silêncio reduz o estresse em até 68%, superando caminhar (42%) ou ouvir música (61%).
              </p>
            </div>
          </div>

          <!-- Benefício 6: Fluência Verbal & Densidade Lexical -->
          <div class="p-7 rounded-3xl bg-white/[0.02] border border-divider hover:border-accent/40 transition-all duration-300 flex flex-col justify-between gap-5 group">
            <div class="flex flex-col gap-3.5">
              <div class="flex items-center justify-between">
                <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                  <GraduationCapIcon class="w-5 h-5" />
                </div>
                <span class="font-technical text-[9px] uppercase tracking-wider text-accent font-semibold px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20">
                  UCL & Oxford
                </span>
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary group-hover:text-accent transition-colors">
                Fluência Verbal & Articulação de Ideias
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                A exposição a vocabulários ricos e estruturas sintáticas variadas amplifica a precisão conceitual. Indivíduos que leem livros comunicam teses com maior clareza, persuasão e autoridade intelectual.
              </p>
            </div>
            <div class="pt-3 border-t border-divider/60 flex flex-col gap-1">
              <span class="font-technical text-[10px] text-textSecondary/80 uppercase tracking-wider">Evidência Científica:</span>
              <p class="font-interface text-[11px] text-textSecondary italic">
                Centre for Longitudinal Studies (UCL): O hábito da leitura na vida adulta é o maior preditor isolado de crescimento no vocabulário e na cognição verbal.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. SEÇÃO CIENTÍFICA II: A CIÊNCIA DA ANOTAÇÃO & RETENÇÃO DEFINITIVA (SEGUNDO CÉREBRO) -->
      <section id="ciencia-anotacao" class="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white/[0.03] via-bgPanel to-bgPanel border border-divider shadow-2xl flex flex-col gap-10 scroll-mt-10">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div class="flex flex-col gap-3 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-technical text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold w-fit">
              <LayersIcon class="w-3.5 h-3.5" />
              <span>Ciência da Aprendizagem & Memória de Longo Prazo</span>
            </div>
            <h2 class="font-editorial text-3xl sm:text-4xl md:text-5xl font-light text-textPrimary leading-tight">
              Por que anotar <span class="text-accent italic font-normal">multiplica a retenção</span> e transforma leitura em competência
            </h2>
            <p class="font-interface text-sm sm:text-base text-textSecondary leading-relaxed">
              Sublinhar passivamente ou apenas reler cria a <em>ilusão de competência</em>: você reconhece o texto, mas não o domina. Anotar reflexivamente, conectar ideias em um grafo e praticar recuperação ativa são os únicos métodos com suporte empírico para fixação perene.
            </p>
          </div>

          <NuxtLink
            to="/curva-do-esquecimento"
            class="px-5 py-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-divider hover:border-accent/40 text-textPrimary font-interface text-xs transition-all flex items-center gap-2 shrink-0 self-start md:self-auto shadow-sm group"
          >
            <InfoIcon class="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            <span>Ver Curva de Esquecimento</span>
            <ArrowRightIcon class="w-3.5 h-3.5 text-textSecondary group-hover:text-textPrimary transition-colors" />
          </NuxtLink>
        </div>

        <!-- Pilares Científicos da Anotação e Retenção -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Pilar de Anotação 1: Níveis de Processamento -->
          <div class="p-6 rounded-2xl bg-black/[0.02] dark:bg-black/40 border border-divider flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-2.5">
              <div class="flex items-center justify-between">
                <span class="font-technical text-[9px] uppercase tracking-widest text-accent font-semibold">Teoria Semântica</span>
                <span class="font-technical text-[9px] text-textSecondary">1972 / 1975</span>
              </div>
              <h4 class="font-editorial text-lg text-textPrimary font-light">Processamento Semântico Profundo</h4>
              <p class="font-interface text-xs text-textSecondary leading-relaxed">
                Anotar conceitos com suas próprias palavras força o cérebro a decodificar significados profundos, gerando traços de memória duradouros que a leitura passiva não consegue criar.
              </p>
            </div>
            <div class="pt-2 border-t border-divider/40 font-technical text-[10px] text-textSecondary/90 italic">
              Craik & Lockhart (JEP): A profundidade do processamento determina a retenção mnemônica.
            </div>
          </div>

          <!-- Pilar de Anotação 2: Efeito de Geração -->
          <div class="p-6 rounded-2xl bg-black/[0.02] dark:bg-black/40 border border-divider flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-2.5">
              <div class="flex items-center justify-between">
                <span class="font-technical text-[9px] uppercase tracking-widest text-accent font-semibold">Síntese Ativa</span>
                <span class="font-technical text-[9px] text-textSecondary">Psychol. Sci.</span>
              </div>
              <h4 class="font-editorial text-lg text-textPrimary font-light">Efeito de Geração & Síntese</h4>
              <p class="font-interface text-xs text-textSecondary leading-relaxed">
                Ao selecionar e sintetizar passagens-chave em vez de copiar passivamente, a mente reorganiza o conhecimento e potencializa a capacidade de generalização e aplicação prática.
              </p>
            </div>
            <div class="pt-2 border-t border-divider/40 font-technical text-[10px] text-textSecondary/90 italic">
              Mueller & Oppenheimer (Princeton & UCLA): Síntese ativa gera compreensão conceitual superior.
            </div>
          </div>

          <!-- Pilar de Anotação 3: Retrieval Practice -->
          <div class="p-6 rounded-2xl bg-black/[0.02] dark:bg-black/40 border border-divider flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-2.5">
              <div class="flex items-center justify-between">
                <span class="font-technical text-[9px] uppercase tracking-widest text-accent font-semibold">Testing Effect</span>
                <span class="font-technical text-[9px] text-textSecondary">Science 2006</span>
              </div>
              <h4 class="font-editorial text-lg text-textPrimary font-light">Recuperação Ativa de Memória</h4>
              <p class="font-interface text-xs text-textSecondary leading-relaxed">
                O Aresta converte suas anotações em flashcards. Responder perguntas a partir das anotações consolida sinapses e retém até 80% mais dados a longo prazo do que apenas reler.
              </p>
            </div>
            <div class="pt-2 border-t border-divider/40 font-technical text-[10px] text-textSecondary/90 italic">
              Roediger & Karpicke (Science): Testar e recuperar ativamente supera qualquer releitura passiva.
            </div>
          </div>

          <!-- Pilar de Anotação 4: Carga Cognitiva & Grafos -->
          <div class="p-6 rounded-2xl bg-black/[0.02] dark:bg-black/40 border border-divider flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-2.5">
              <div class="flex items-center justify-between">
                <span class="font-technical text-[9px] uppercase tracking-widest text-accent font-semibold">Mente Estendida</span>
                <span class="font-technical text-[9px] text-textSecondary">Cognitive Load</span>
              </div>
              <h4 class="font-editorial text-lg text-textPrimary font-light">Externalização em Grafo Vivo</h4>
              <p class="font-interface text-xs text-textSecondary leading-relaxed">
                Conectar notas em um grafo visual descarrega a memória de trabalho (capacidade finita de 4 a 7 itens), liberando largura de banda mental para insights interdisciplinares e criatividade.
              </p>
            </div>
            <div class="pt-2 border-t border-divider/40 font-technical text-[10px] text-textSecondary/90 italic">
              Sweller & Clark/Chalmers: Mapas e nós conceituais reduzem a sobrecarga cognitiva extrínseca.
            </div>
          </div>
        </div>

        <!-- Box de Destaque / Comparativo: Leitura Passiva vs Sistema Aresta -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          <div class="p-6 rounded-2xl bg-red-500/[0.04] border border-red-500/20 flex flex-col gap-3">
            <div class="flex items-center gap-2 text-red-400 font-technical text-xs uppercase tracking-wider font-semibold">
              <ZapOffIcon class="w-4 h-4" />
              <span>O Ciclo Ineficiente da Leitura Tradicional</span>
            </div>
            <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
              Você lê um livro de 300 páginas sem anotar ou grifando passivamente. Em 48 horas, 70% das teses foram esquecidas (Curva de Ebbinghaus). Ao final de 6 meses, restam apenas vagas impressões e nenhuma capacidade real de citar, aplicar ou cruzar conceitos no trabalho.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-accent/[0.08] border border-accent/30 flex flex-col gap-3">
            <div class="flex items-center gap-2 text-accent font-technical text-xs uppercase tracking-wider font-semibold">
              <SparklesIcon class="w-4 h-4" />
              <span>O Fluxo Científico Integrado do Aresta</span>
            </div>
            <p class="font-interface text-xs sm:text-sm text-textPrimary/90 leading-relaxed">
              Você lê com foco limpo, anota reflexões sem fricção, visualiza conceitos se conectando no grafo de conhecimento e revisa micro-flashcards diários com repetição espaçada. O resultado é a transferência definitiva do conteúdo para a sua memória de longo prazo e competência prática.
            </p>
          </div>
        </div>
      </section>

      <!-- 5. SEÇÃO DE INDAGAÇÕES E TRANSFORMAÇÃO PRÁTICA (COPYWRITING PERSUASIVO) -->
      <section class="flex flex-col gap-8">
        <div class="flex flex-col items-start text-left gap-2 max-w-3xl">
          <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-accent flex items-center gap-2">
            <CompassIcon class="w-3.5 h-3.5" />
            Evolução Pessoal & Intelectual
          </div>
          <h2 class="font-editorial text-3xl sm:text-4xl font-light text-textPrimary leading-tight">
            Para quem busca clareza e domínio em um mundo de atenção fragmentada
          </h2>
          <p class="font-interface text-sm sm:text-base text-textSecondary leading-relaxed">
            A maioria das pessoas lê dezenas de artigos e livros, mas esquece quase tudo em semanas. Como seria sua rotina se cada página lida se transformasse em competência permanente embasada pela neurociência?
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Pergunta 1: Sentir-se mais competente -->
          <div class="p-7 rounded-3xl bg-white/[0.02] border border-divider hover:border-accent/40 transition-all duration-300 flex flex-col gap-3.5 relative overflow-hidden group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <TargetIcon class="w-5 h-5" />
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary group-hover:text-accent transition-colors">
                Gostaria de se sentir mais competente?
              </h3>
            </div>
            <p class="font-interface text-sm text-textSecondary leading-relaxed">
              A verdadeira confiança técnica nasce do domínio profundo de fundamentos. Ao estruturar anotações reflexivas e conectá-las em um grafo vivo, você desenvolve autoridade autêntica, articula ideias complexas com facilidade e toma decisões embasadas no trabalho e na vida acadêmica.
            </p>
          </div>

          <!-- Pergunta 2: Ser especialista em algo -->
          <div class="p-7 rounded-3xl bg-white/[0.02] border border-divider hover:border-accent/40 transition-all duration-300 flex flex-col gap-3.5 relative overflow-hidden group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <GraduationCapIcon class="w-5 h-5" />
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary group-hover:text-accent transition-colors">
                Quer se tornar especialista em algo?
              </h3>
            </div>
            <p class="font-interface text-sm text-textSecondary leading-relaxed">
              Nenhum especialista constrói maestria consumindo resumos superficiais em redes sociais. O Aresta oferece o espaço de leitura calma, sem ruído, onde você disseca obras densas, compara autores e cruza conceitos entre capítulos até atingir o estado de fluência no assunto.
            </p>
          </div>

          <!-- Pergunta 3: Ter um hobby / dominar paixões -->
          <div class="p-7 rounded-3xl bg-white/[0.02] border border-divider hover:border-accent/40 transition-all duration-300 flex flex-col gap-3.5 relative overflow-hidden group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <SparklesIcon class="w-5 h-5" />
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary group-hover:text-accent transition-colors">
                Quer dominar um novo hobby ou paixão?
              </h3>
            </div>
            <p class="font-interface text-sm text-textSecondary leading-relaxed">
              Seja filosofia, história da arte, programação ou música: aprender um novo interesse requer relacionar teorias com a prática. Centralize seus livros técnicos e guias em um único acervo, faça marcações rápidas e construa conexões que aceleram sua curva de aprendizado.
            </p>
          </div>

          <!-- Pergunta 4: Melhorar a vida e organizar estudos -->
          <div class="p-7 rounded-3xl bg-white/[0.02] border border-divider hover:border-accent/40 transition-all duration-300 flex flex-col gap-3.5 relative overflow-hidden group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <BrainIcon class="w-5 h-5" />
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary group-hover:text-accent transition-colors">
                Quer transformar seus estudos e melhorar sua vida?
              </h3>
            </div>
            <p class="font-interface text-sm text-textSecondary leading-relaxed">
              Substitua a ansiedade de páginas acumuladas pela satisfação de um segundo cérebro organizado. O Aresta organiza seu fluxo de estudo de ponta a ponta: da leitura fluida ao flashcard de revisão diária, sem sobrecarga cognitiva.
            </p>
          </div>
        </div>
      </section>

      <!-- 6. SEÇÃO DE FILOSOFIA: MINIMALISMO & TECNOLOGIA CALMA (ANTI-DOPAMINA) -->
      <section class="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent border border-divider flex flex-col gap-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex flex-col gap-2 max-w-2xl">
            <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-accent flex items-center gap-2">
              <ZapOffIcon class="w-4 h-4" />
              A Filosofia do Aresta · Neurobiologia da Atenção
            </div>
            <h2 class="font-editorial text-2xl sm:text-3xl md:text-4xl font-light text-textPrimary leading-tight">
              Por que o Aresta é intencionalmente minimalista e anti-dopaminérgico?
            </h2>
          </div>
          <NuxtLink
            to="/por-que-ler"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-divider hover:border-accent/40 text-textPrimary font-interface text-xs transition-all shrink-0 self-start md:self-auto"
          >
            <span>Ler Ensaio Cognitivo Completo</span>
            <ArrowRightIcon class="w-3.5 h-3.5 text-accent" />
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div class="p-5 rounded-2xl bg-black/[0.02] dark:bg-black/40 border border-divider flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <h4 class="font-editorial text-lg text-textPrimary">Silêncio Cognitivo</h4>
              <span class="font-technical text-[9px] uppercase tracking-wider text-accent">Zero Ruído</span>
            </div>
            <p class="font-interface text-xs text-textSecondary leading-relaxed">
              Sem banners, sem pop-ups estridentes e sem notificações viciantes. Uma interface limpa que desaparece para que apenas você e a linha de raciocínio existam.
            </p>
          </div>

          <div class="p-5 rounded-2xl bg-black/[0.02] dark:bg-black/40 border border-divider flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <h4 class="font-editorial text-lg text-textPrimary">Foco Sustentado</h4>
              <span class="font-technical text-[9px] uppercase tracking-wider text-accent">Baixa Dopamina</span>
            </div>
            <p class="font-interface text-xs text-textSecondary leading-relaxed">
              Substituímos o vício em micro-recompensas rápidas pelo prazer autêntico da leitura contínua. Treine sua musculatura de concentração página por página.
            </p>
          </div>

          <div class="p-5 rounded-2xl bg-black/[0.02] dark:bg-black/40 border border-divider flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <h4 class="font-editorial text-lg text-textPrimary">Processamento Ativo</h4>
              <span class="font-technical text-[9px] uppercase tracking-wider text-accent">Digestão Semântica</span>
            </div>
            <p class="font-interface text-xs text-textSecondary leading-relaxed">
              Ler sem refletir é passividade. O Aresta transforma você em um leitor ativo que destaca teses, gera perguntas de flashcard e tece conexões conceituais no grafo.
            </p>
          </div>
        </div>
      </section>

      <!-- 7. FUNCIONALIDADES DO ECOSSISTEMA ARESTA (PILARES) -->
      <section id="pilares" class="flex flex-col gap-8 scroll-mt-10">
        <div class="flex flex-col items-center text-center gap-2 max-w-2xl mx-auto">
          <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">
            Recursos Integrados
          </div>
          <h2 class="font-editorial text-3xl sm:text-4xl font-light text-textPrimary">
            O Ecossistema Completo do Leitor
          </h2>
          <p class="font-interface text-sm sm:text-base text-textSecondary leading-relaxed">
            Cada ferramenta foi desenhada como uma extensão do seu pensamento, unindo leitura, memória e conexão com suporte da ciência cognitiva.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Pilar 1: Leitura Fluida -->
          <div class="p-6 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-divider flex flex-col gap-3 hover:border-accent/40 transition-colors">
            <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <BookOpenIcon class="w-5 h-5" />
            </div>
            <h3 class="font-editorial text-lg font-light text-textPrimary">Leitura Imersiva</h3>
            <p class="font-interface text-xs text-textSecondary leading-relaxed">
              Suporte integrado a EPUB e PDF com tipografia customizável, modo sépia/noturno e virada realista de páginas com física de folha.
            </p>
          </div>

          <!-- Pilar 2: Grafo de Conhecimento -->
          <div class="p-6 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-divider flex flex-col gap-3 hover:border-accent/40 transition-colors">
            <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <NetworkIcon class="w-5 h-5" />
            </div>
            <h3 class="font-editorial text-lg font-light text-textPrimary">Grafo Conceitual</h3>
            <p class="font-interface text-xs text-textSecondary leading-relaxed">
              Conecte nós de temas e ideias entre diferentes obras em um mapa mental vivo e navegável baseado na Teoria da Mente Estendida.
            </p>
          </div>

          <!-- Pilar 3: Flashcards & Retenção Ativa -->
          <div class="p-6 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-divider flex flex-col gap-3 hover:border-accent/40 transition-colors">
            <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <BrainIcon class="w-5 h-5" />
            </div>
            <h3 class="font-editorial text-lg font-light text-textPrimary">Retenção Ativa</h3>
            <p class="font-interface text-xs text-textSecondary leading-relaxed">
              Flashcards com repetição espaçada e sínteses geradas a partir de suas citações e anotações para fixar cada ideia para sempre.
            </p>
          </div>

          <!-- Pilar 4: Conversor Inteligente -->
          <div class="p-6 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-divider flex flex-col gap-3 hover:border-accent/40 transition-colors">
            <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <FileCode2Icon class="w-5 h-5" />
            </div>
            <h3 class="font-editorial text-lg font-light text-textPrimary">Conversor PDF &rarr; EPUB</h3>
            <p class="font-interface text-xs text-textSecondary leading-relaxed">
              Converta documentos técnicos e livros para formato responsivo adaptado para qualquer tela com total fluidez.
            </p>
          </div>
        </div>
      </section>

      <!-- 8. A CIÊNCIA DA RETENÇÃO & CURVA DO ESQUECIMENTO (COLOCADA APÓS A DESCRIÇÃO DO PRODUTO) -->
      <section class="p-6 sm:p-8 rounded-3xl bg-bgPanel border border-divider shadow-2xl flex flex-col gap-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div class="flex flex-col gap-1.5 max-w-2xl">
            <div class="flex items-center gap-2 font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">
              <BrainIcon class="w-4 h-4 text-accent" />
              A Ciência da Memória & Retenção Definitiva
            </div>
            <h2 class="font-editorial text-2xl sm:text-3xl font-light text-textPrimary leading-tight">
              A Revisão de Conhecimento & Curva de Ebbinghaus
            </h2>
            <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
              Ler sem revisar é esquecer 70% em 48 horas. O Aresta integra flashcards e repetição espaçada automática direto das suas marcações para reter cada ideia para sempre.
            </p>
          </div>

          <!-- Link com Ícone de Informação para Demonstração Completa da Curva de Ebbinghaus -->
          <NuxtLink
            to="/curva-do-esquecimento"
            data-testid="ebbinghaus-info-link"
            class="px-4 py-2 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-divider hover:border-accent/40 text-textPrimary font-interface text-xs transition-all flex items-center gap-2 shrink-0 group"
          >
            <InfoIcon class="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            <span>Ver Curva de Ebbinghaus</span>
            <ArrowRightIcon class="w-3.5 h-3.5 text-textSecondary group-hover:text-textPrimary transition-colors" />
          </NuxtLink>
        </div>

        <!-- Gráfico Nativo D3.js da Curva de Esquecimento (Compacto) -->
        <div class="bg-black/[0.02] dark:bg-black/50 p-3 sm:p-5 rounded-2xl border border-divider">
          <EbbinghausChart />
        </div>
      </section>

      <!-- 9. SEÇÃO DE CONVERSÃO / EXPERIMENTE O ARESTA (CHAMADA PARA AÇÃO COM LINKS DEDICADOS) -->
      <section id="comece-agora" class="flex flex-col lg:flex-row items-center justify-between gap-8 p-8 sm:p-12 rounded-3xl bg-bgPanel border border-divider shadow-2xl">
        <div class="flex flex-col gap-4 text-left max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-technical text-[10px] uppercase tracking-widest font-semibold w-fit">
            Acesso Imediato
          </div>

          <h2 class="font-editorial text-3xl sm:text-4xl md:text-5xl font-light text-textPrimary leading-tight">
            Pronto para transformar sua leitura em <span class="text-accent italic">sabedoria duradoura</span>?
          </h2>

          <p class="font-interface text-sm sm:text-base text-textSecondary leading-relaxed">
            Junte-se a leitores, estudantes e pesquisadores que construíram seu segundo cérebro no Aresta. Crie sua conta gratuita em menos de 1 minuto ou acesse instantaneamente a demonstração.
          </p>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
            <NuxtLink
              to="/login"
              data-testid="landing-cta-login-btn"
              class="bg-textPrimary text-bgApp font-interface text-sm sm:text-base font-semibold px-7 py-3.5 rounded-full hover:opacity-90 transition-all flex items-center justify-center gap-2.5 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Acessar Conta</span>
              <ArrowRightIcon class="w-4 h-4 text-bgApp" />
            </NuxtLink>

            <NuxtLink
              to="/login?tab=register"
              data-testid="landing-cta-register-btn"
              class="px-7 py-3.5 rounded-full bg-accent text-white font-interface text-sm sm:text-base font-semibold hover:bg-accent/90 transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Criar Conta</span>
            </NuxtLink>
          </div>
        </div>

        <div class="flex flex-col gap-3 text-xs sm:text-sm text-textSecondary font-interface bg-black/[0.02] dark:bg-white/[0.02] border border-divider/60 rounded-2xl p-6 lg:max-w-sm w-full">
          <div class="flex items-center gap-2.5">
            <CheckCircle2Icon class="w-4 h-4 text-accent shrink-0" />
            <span>Leitor universal para seus arquivos EPUB e PDF</span>
          </div>
          <div class="flex items-center gap-2.5">
            <CheckCircle2Icon class="w-4 h-4 text-accent shrink-0" />
            <span>Grafo de conexões conceituais navegável</span>
          </div>
          <div class="flex items-center gap-2.5">
            <CheckCircle2Icon class="w-4 h-4 text-accent shrink-0" />
            <span>Flashcards inteligentes e repetição espaçada</span>
          </div>
          <div class="flex items-center gap-2.5">
            <CheckCircle2Icon class="w-4 h-4 text-accent shrink-0" />
            <span>100% livre de distrações, anúncios e algoritmos viciantes</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  ArrowRightIcon,
  BrainIcon,
  BookOpenIcon,
  NetworkIcon,
  FileCode2Icon,
  FileTextIcon,
  UserIcon,
  LockIcon,
  MailIcon,
  KeyIcon,
  AlertCircleIcon,
  InfoIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  SparklesIcon,
  ZapOffIcon,
  TargetIcon,
  GraduationCapIcon,
  CompassIcon,
  CheckCircle2Icon,
  MicroscopeIcon,
  HeartPulseIcon,
  ShieldCheckIcon,
  LayersIcon,
  LightbulbIcon
} from 'lucide-vue-next'
import ReadingStreak from '~/components/ReadingStreak.vue'
import EbbinghausChart from '~/components/EbbinghausChart.vue'
import SidebarGraph from '~/components/SidebarGraph.vue'
import ArestaLogoGraph from '~/components/ArestaLogoGraph.vue'
import HomeBookReaderDemo from '~/components/HomeBookReaderDemo.vue'
import HomeKnowledgeGraphDemo from '~/components/HomeKnowledgeGraphDemo.vue'
import { useAuth } from '~/composables/useAuth'
import { useSettings } from '~/composables/useSettings'
import { useUserBooks } from '~/composables/useUserBooks'
import { useFlashcards } from '~/composables/useFlashcards'
import { getCoverUrl } from '~/utils/cover'

// Otimização Completa de SEO para a Landing Page e Home do Aresta
if (typeof useHead === 'function') {
  useHead({
    title: 'Aresta — Leitura Profunda, Segundo Cérebro & Gestão de Conhecimento',
    meta: [
      {
        name: 'description',
        content: 'Ecossistema minimalista e anti-dopaminérgico para leitura de EPUB e PDF. Construa seu segundo cérebro, retenha o que aprende com repetição espaçada e torne-se especialista.'
      },
      {
        name: 'keywords',
        content: 'leitura profunda, segundo cérebro, gestão de conhecimento, pkm, retenção de conhecimento, epub reader, leitor pdf, curva de esquecimento, flashcards, repetição espaçada, minimalismo digital, foco, estudos, aprendizado'
      },
      { property: 'og:title', content: 'Aresta — Leitura Profunda, Segundo Cérebro & Gestão de Conhecimento' },
      {
        property: 'og:description',
        content: 'Ecossistema minimalista e anti-dopaminérgico para leitura de EPUB e PDF. Construa seu segundo cérebro e retenha conhecimento com repetição espaçada.'
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Aresta — Leitura Profunda, Segundo Cérebro & Gestão de Conhecimento' },
      {
        name: 'twitter:description',
        content: 'Ecossistema minimalista e anti-dopaminérgico para leitura de EPUB e PDF. Construa seu segundo cérebro.'
      }
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Aresta',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web, Mobile, Desktop',
          description: 'Leitor de EPUB e PDF minimalista e anti-dopaminérgico com grafo de conhecimento, flashcards e repetição espaçada.',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'BRL'
          }
        })
      }
    ]
  })
}

const auth = useAuth()
const { loadFromServer, desktopHomeGraphOpen } = useSettings()
const { userBooks, fetchUserBooks } = useUserBooks()
const flashcards = useFlashcards()

const coverError = ref(false)
const isGraphCollapsed = ref(!desktopHomeGraphOpen.value)

const toggleGraph = () => {
  isGraphCollapsed.value = !isGraphCollapsed.value
  if (typeof window !== 'undefined') {
    localStorage.setItem('aresta_home_graph_collapsed', String(isGraphCollapsed.value))
  }
}

const resetScrollToTop = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const mainElem = document.querySelector('main')
    if (mainElem) {
      mainElem.scrollTop = 0
    }
  }
}

watch(
  () => auth.isLoggedIn.value,
  async (loggedIn) => {
    if (loggedIn) {
      await nextTick()
      resetScrollToTop()
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => resetScrollToTop())
      }
    }
  }
)

watch(
  () => desktopHomeGraphOpen.value,
  (val) => {
    isGraphCollapsed.value = !val
  }
)

onMounted(async () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('aresta_home_graph_collapsed')
    if (saved !== null) {
      isGraphCollapsed.value = saved === 'true'
    } else {
      isGraphCollapsed.value = !desktopHomeGraphOpen.value
    }
  }

  if (auth.isLoggedIn.value) {
    resetScrollToTop()
    try {
      await fetchUserBooks()
      await flashcards.fetchFirstDailyCard()
    } catch (e) {
      // Fallback gracioso caso backend esteja offline
    }
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

// 3 Anotações em destaque do último livro que está sendo lido
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
      chapter: 'Capítulo V',
      page: 68,
      date: 'Ontem',
      quote: 'A ciência é a minha esposa única, e a Casa Verde o meu laboratório.',
      insight: 'O isolamento epistemológico do médico e a obsessão pela classificação universal dos desvios humanos.'
    },
    {
      id: 'n3',
      chapter: 'Capítulo VII',
      page: 95,
      date: 'Há 2 dias',
      quote: 'A loucura, objeto dos meus estudos, era até agora uma ilha perdida no oceano da razão; começo a suspeitar que é um continente.',
      insight: 'A inversão irônica da premissa: quando a norma passa a ser a exceção e toda a vila é diagnosticada como insana.'
    }
  ]
})

// Primeiro Flashcard do Dia
const dailyFlashcard = computed(() => {
  if (flashcards.firstCard.value) {
    return {
      id: String(flashcards.firstCard.value.id),
      bookTitle: flashcards.firstCard.value.bookTitle,
      chapter: flashcards.firstCard.value.chapterTitle || 'Revisão Espaçada',
      question: flashcards.firstCard.value.question,
      answer: flashcards.firstCard.value.answer
    }
  }
  return {
    id: 'f1',
    bookTitle: activeBookShortTitle.value,
    chapter: 'Cap. III: A Casa Verde',
    question: 'Qual é o critério inicial usado por Simão Bacamarte para internar pacientes na Casa Verde?',
    answer: 'Qualquer desvio do equilíbrio moral ou manifestação excessiva de paixão, soberba ou virtude fora do comum.'
  }
})
</script>
