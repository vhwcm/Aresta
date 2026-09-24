<template>
  <div :class="auth.isLoggedIn.value ? 'h-full w-full flex-1 flex flex-col min-h-0' : ''">
    <!-- ESTADO 1: USUÁRIO AUTENTICADO (Workspace Unificado de Canvas & Notas) -->
    <UnifiedCanvasHub v-if="auth.isLoggedIn.value" data-testid="auth-home" class="flex-1 min-h-0" />

    <!-- ESTADO 2: VISITANTE NÃO AUTENTICADO (Página Inicial Pública / Landing Page do Aresta) -->
    <div v-else data-testid="guest-landing" class="flex flex-col gap-16 md:gap-24 py-6 md:py-10 animate-in fade-in duration-500 max-w-6xl mx-auto w-full">
      <!-- 1. SEÇÃO HERO DA LANDING PAGE (LAYOUT ESTRUTURADO EM 2 COLUNAS) -->
      <header class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-2 md:pt-6">
        <!-- Coluna da Esquerda: Textos, Chamada Principal e CTAs -->
        <div class="lg:col-span-7 flex flex-col items-start text-left gap-5">
          <h1 class="font-editorial text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-textPrimary leading-[1.12]">
            Transforme cada livro e anotação em <span class="text-accent italic font-normal">retenção duradoura</span> de conhecimento.
          </h1>

          <p class="font-interface text-sm sm:text-base md:text-lg text-textSecondary max-w-xl leading-relaxed">
            O <strong>Aresta</strong> une leitura imersiva de livros (EPUB e PDF), anotações inteligentes em Markdown e um canvas espacial infinito. Porque ler sem sintetizar é esquecer em 48h: formule notas ativas nas suas próprias palavras, conecte ideias visualmente no canvas e garanta retenção permanente para se tornar especialista.
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
              <span>Por que usar o Aresta?</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Coluna da Direita: Card Estruturado de Demonstração / Preview Visual do Pipeline de Retenção -->
        <div class="lg:col-span-5 flex flex-col justify-center">
          <div class="rounded-3xl bg-bgPanel border border-divider p-6 sm:p-7 shadow-2xl backdrop-blur-xl flex flex-col gap-4 relative overflow-hidden group hover:border-accent/40 transition-all duration-500">
            <!-- Barra Superior do Card -->
            <div class="flex items-center justify-between pb-3 border-b border-divider/60">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-black/10 dark:bg-white/10"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-black/10 dark:bg-white/10"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-black/10 dark:bg-white/10"></span>
                <span class="font-technical text-[10px] uppercase tracking-wider text-textSecondary ml-1.5 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Pipeline de Retenção Ativa
                </span>
              </div>
              <ArestaLogoGraph :size="28" :to="null" use-image />
            </div>

            <!-- Etapa 1: Excerpt de Leitura com Destaque Ativo -->
            <div class="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-black/40 border border-divider flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="font-technical text-[10px] text-accent font-semibold uppercase tracking-wider flex items-center gap-1">
                  <BookOpenIcon class="w-3 h-3 text-accent" />
                  1. Livro · O Alienista (Pág. 42)
                </span>
                <span class="font-technical text-[9px] text-textSecondary">Grifo no EPUB</span>
              </div>
              <blockquote class="font-editorial text-xs sm:text-sm text-textPrimary italic border-l-2 border-accent pl-2.5 leading-relaxed">
                "A razão é a perfeita saúde da alma; a loucura é a alteração dessa saúde."
              </blockquote>
            </div>

            <!-- Etapa 2: Nota Elaborativa do Usuário -->
            <div class="p-3.5 rounded-2xl bg-accent/[0.04] border border-accent/30 flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <span class="font-technical text-[10px] uppercase tracking-wider text-accent font-semibold flex items-center gap-1">
                  <FileTextIcon class="w-3 h-3 text-accent" />
                  2. Nota Ativa (Markdown)
                </span>
                <span class="font-technical text-[9px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-semibold">
                  #epistemologia
                </span>
              </div>
              <p class="font-interface text-[11px] text-textPrimary/90 leading-snug">
                Bacamarte define a razão por exclusão até internar 80% da vila. A certeza científica cega o observador.
              </p>
            </div>

            <!-- Etapa 3: Grafo de Conhecimento & Conexões Semânticas -->
            <div class="p-3 rounded-2xl bg-black/[0.02] dark:bg-black/40 border border-divider flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <div class="font-technical text-[10px] uppercase tracking-wider text-textSecondary flex items-center gap-1.5">
                  <NetworkIcon class="w-3.5 h-3.5 text-accent" />
                  <span>3. Grafo de Conhecimento</span>
                </div>
                <span class="font-technical text-[9px] text-emerald-500 font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Rede Semântica Viva</span>
                </span>
              </div>

              <!-- Visual Orgânico do Grafo de Conhecimento (Como é no Aresta de Verdade) -->
              <div class="relative w-full h-32 rounded-xl bg-black/[0.03] dark:bg-black/60 border border-divider/60 overflow-hidden select-none flex items-center justify-center">
                <div class="absolute inset-0 bg-grid-pattern bg-grid-size opacity-10 pointer-events-none"></div>

                <svg class="w-full h-full" viewBox="0 0 380 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- Arestas / Conexões do Grafo com o Nó Raiz e Entre Temas -->
                  <line x1="190" y1="56" x2="76" y2="38" stroke="currentColor" class="text-accent/40" stroke-width="1.6" />
                  <circle cx="133" cy="47" r="1.8" class="fill-accent animate-pulse" opacity="0.8" />

                  <line x1="190" y1="56" x2="304" y2="38" stroke="currentColor" class="text-accent/40" stroke-width="1.6" />
                  <circle cx="247" cy="47" r="1.8" class="fill-accent animate-pulse" opacity="0.8" />

                  <line x1="190" y1="56" x2="115" y2="96" stroke="currentColor" class="text-accent/30" stroke-width="1.4" stroke-dasharray="3 3" />

                  <line x1="76" y1="38" x2="115" y2="96" stroke="currentColor" class="text-accent/45" stroke-width="1.4" />
                  <circle cx="95" cy="67" r="1.5" class="fill-accent animate-pulse" opacity="0.7" />

                  <line x1="190" y1="56" x2="265" y2="96" stroke="currentColor" class="text-emerald-500/35" stroke-width="1.4" stroke-dasharray="3 3" />

                  <line x1="304" y1="38" x2="265" y2="96" stroke="currentColor" class="text-emerald-500/45" stroke-width="1.4" />
                  <circle cx="284" cy="67" r="1.5" class="fill-emerald-400 animate-pulse" opacity="0.7" />

                  <line x1="115" y1="96" x2="265" y2="96" stroke="currentColor" class="text-textSecondary/20" stroke-width="1" stroke-dasharray="2 2" />

                  <!-- NÓ CENTRAL: Meu Conhecimento (Raiz) -->
                  <g class="cursor-pointer group/node">
                    <circle cx="190" cy="56" r="22" class="fill-accent/10 stroke-accent/30" stroke-width="1" stroke-dasharray="2 2" />
                    <circle cx="190" cy="56" r="16" class="fill-bgPanel stroke-accent shadow-sm" stroke-width="1.8" />
                    <circle cx="190" cy="56" r="12" fill="none" stroke="currentColor" class="text-accent/20" stroke-width="1" />
                    <g transform="translate(182, 48) scale(0.67)" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" class="text-textPrimary pointer-events-none">
                      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04" />
                      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04" />
                    </g>
                    <text x="190" y="80" text-anchor="middle" class="fill-accent text-[8px] font-technical font-semibold tracking-tight">Meu Conhecimento</text>
                  </g>

                  <!-- NÓ 1: Epistemologia -->
                  <g class="cursor-pointer group/node">
                    <circle cx="76" cy="38" r="17" class="fill-bgPanel stroke-divider hover:stroke-accent transition-colors shadow-sm" stroke-width="1.4" />
                    <circle cx="76" cy="38" r="13" fill="none" stroke="currentColor" class="text-divider/60" stroke-width="0.8" />
                    <g transform="translate(69, 31) scale(0.58)" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" class="text-textPrimary pointer-events-none">
                      <line x1="3" y1="21" x2="21" y2="21" />
                      <line x1="12" y1="3" x2="3" y2="8" />
                      <line x1="12" y1="3" x2="21" y2="8" />
                      <line x1="3" y1="8" x2="21" y2="8" />
                      <line x1="7" y1="11" x2="7" y2="18" />
                      <line x1="12" y1="11" x2="12" y2="18" />
                      <line x1="17" y1="11" x2="17" y2="18" />
                    </g>
                    <text x="76" y="60" text-anchor="middle" class="fill-textPrimary text-[8px] font-technical font-medium">Epistemologia</text>
                  </g>

                  <!-- NÓ 2: Filosofia da Mente -->
                  <g class="cursor-pointer group/node">
                    <circle cx="304" cy="38" r="17" class="fill-bgPanel stroke-divider hover:stroke-sky-400 transition-colors shadow-sm" stroke-width="1.4" />
                    <circle cx="304" cy="38" r="13" fill="none" stroke="currentColor" class="text-divider/60" stroke-width="0.8" />
                    <g transform="translate(297, 31) scale(0.58)" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" class="text-textPrimary pointer-events-none">
                      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                      <path d="M9 18h6" />
                      <path d="M10 22h4" />
                    </g>
                    <text x="304" y="60" text-anchor="middle" class="fill-textPrimary text-[8px] font-technical font-medium">Filosofia da Mente</text>
                  </g>

                  <!-- NÓ 3: Livro Ativo (O Alienista) -->
                  <g class="cursor-pointer group/node">
                    <circle cx="115" cy="96" r="14" class="fill-bgPanel stroke-divider hover:stroke-accent transition-colors shadow-sm" stroke-width="1.4" />
                    <circle cx="115" cy="96" r="10.5" fill="none" stroke="currentColor" class="text-divider/60" stroke-width="0.8" />
                    <g transform="translate(108.5, 89.5) scale(0.54)" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" class="text-textPrimary pointer-events-none">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </g>
                    <text x="115" y="115" text-anchor="middle" class="fill-accent text-[7.5px] font-technical font-semibold">O Alienista</text>
                  </g>

                  <!-- NÓ 4: Conceito Síntese (Sanidade Relativa) -->
                  <g class="cursor-pointer group/node">
                    <circle cx="265" cy="96" r="14" class="fill-bgPanel stroke-divider hover:stroke-emerald-400 transition-colors shadow-sm" stroke-width="1.4" />
                    <circle cx="265" cy="96" r="10.5" fill="none" stroke="currentColor" class="text-divider/60" stroke-width="0.8" />
                    <g transform="translate(258.5, 89.5) scale(0.54)" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" class="text-textPrimary pointer-events-none">
                      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                      <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
                      <path d="M15.7 8.3c4.54 4.54 6.54 9.87 4.5 11.9-2.03 2.04-7.36.02-11.9-4.5-4.52-4.54-6.54-9.87-4.5-11.9 2.03-2.04 7.36-.02 11.9 4.5Z" />
                    </g>
                    <text x="265" y="115" text-anchor="middle" class="fill-emerald-400 text-[7.5px] font-technical font-medium">Sanidade Relativa</text>
                  </g>
                </svg>
              </div>
            </div>

            <!-- Etapa 4: Mini Flashcard de Retenção Ativa -->
            <div class="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-divider flex items-center justify-between gap-3">
              <div class="flex flex-col gap-0.5">
                <span class="font-technical text-[9px] uppercase tracking-widest text-accent font-semibold flex items-center gap-1">
                  <BrainIcon class="w-3 h-3 text-accent" />
                  4. Flashcard de Retenção Permanente
                </span>
                <span class="font-interface text-xs text-textPrimary line-clamp-1">
                  Critério de Bacamarte para a Casa Verde?
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- 2. DEMONSTRAÇÕES INTERATIVAS AO VIVO: GRAFO DE CONHECIMENTO & CANVAS -->
      <section class="flex flex-col gap-12 sm:gap-16">
        <!-- 1. Demonstração Interativa do Grafo de Conhecimento com D3 Real -->
        <HomeKnowledgeGraphDemo />

        <!-- 2. Demonstração Interativa de Notas Ativas & Canvas Espacial para Retenção -->
        <HomeCanvasNotesDemo />
      </section>

      <!-- 3. SEÇÃO CIENTÍFICA I: OS BENEFÍCIOS DA LEITURA PROFUNDA & RACIOCÍNIO (NEUROCIÊNCIA) -->
      <section id="beneficios-leitura" class="flex flex-col gap-10 scroll-mt-10">
        <div class="flex flex-col items-start text-left gap-3 max-w-3xl">
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

      <!-- 4. SEÇÃO CIENTÍFICA II: A CIÊNCIA DA ANOTAÇÃO & RETENÇÃO DEFINITIVA (CURVA DE EBBINGHAUS INTEGRADA) -->
      <section id="ciencia-anotacao" class="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white/[0.03] via-bgPanel to-bgPanel border border-divider shadow-2xl flex flex-col gap-10 scroll-mt-10">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div class="flex flex-col gap-3 max-w-2xl">
            <h2 class="font-editorial text-3xl sm:text-4xl md:text-5xl font-light text-textPrimary leading-tight">
              Por que anotar <span class="text-accent italic font-normal">multiplica a retenção</span> e transforma leitura em competência
            </h2>
            <p class="font-interface text-sm sm:text-base text-textSecondary leading-relaxed">
              Sublinhar passivamente ou apenas reler cria a <em>ilusão de competência</em>: você reconhece o texto, mas não o domina. Anotar reflexivamente, conectar ideias em um grafo e praticar recuperação ativa são os únicos métodos com suporte empírico para combater o esquecimento e fixar o aprendizado para sempre.
            </p>
          </div>

          <NuxtLink
            to="/curva-do-esquecimento"
            data-testid="ebbinghaus-info-link"
            class="px-5 py-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-divider hover:border-accent/40 text-textPrimary font-interface text-xs transition-all flex items-center gap-2 shrink-0 self-start md:self-auto shadow-sm group"
          >
            <InfoIcon class="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            <span>Ver Curva de Ebbinghaus</span>
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

        <!-- Bloco Integrado: Curva de Ebbinghaus & Revisão Ativa -->
        <div class="flex flex-col gap-4 pt-4 border-t border-divider/60">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div class="flex flex-col gap-1 max-w-2xl">
              <h3 class="font-editorial text-xl sm:text-2xl font-light text-textPrimary leading-tight">
                A Revisão de Conhecimento & Curva de Ebbinghaus
              </h3>
              <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
                Ler sem revisar é esquecer 70% em 48 horas. O Aresta integra flashcards e repetição espaçada automática direto das suas marcações para reter cada ideia para sempre.
              </p>
            </div>
          </div>

          <!-- Gráfico Nativo D3.js da Curva de Esquecimento (Compacto) -->
          <div class="bg-black/[0.02] dark:bg-black/50 p-3 sm:p-5 rounded-2xl border border-divider">
            <EbbinghausChart />
          </div>
        </div>
      </section>

      <!-- 5. SEÇÃO DE INDAGAÇÕES E TRANSFORMAÇÃO PRÁTICA (COPYWRITING PERSUASIVO) -->
      <section class="flex flex-col gap-8">
        <div class="flex flex-col items-start text-left gap-2 max-w-3xl">
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

      <!-- 7. FUNCIONALIDADES DO ECOSSISTEMA ARESTA (PILARES DE RETENÇÃO) -->
      <section id="pilares" class="flex flex-col gap-8 scroll-mt-10">
        <div class="flex flex-col items-center text-center gap-2 max-w-2xl mx-auto">
          <h2 class="font-editorial text-3xl sm:text-4xl font-light text-textPrimary">
            O Ecossistema Completo de Retenção de Conhecimento
          </h2>
          <p class="font-interface text-sm sm:text-base text-textSecondary leading-relaxed">
            Cada ferramenta foi desenhada como uma extensão do seu pensamento, unindo leitura, notas reflexivas, canvas infinito e repetição espaçada para combater o esquecimento.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Pilar 1: Leitura de Livros -->
          <div class="p-6 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-divider flex flex-col gap-3 hover:border-accent/40 transition-colors">
            <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <BookOpenIcon class="w-5 h-5" />
            </div>
            <h3 class="font-editorial text-lg font-light text-textPrimary">1. Leitura de Livros</h3>
            <p class="font-interface text-xs text-textSecondary leading-relaxed">
              Suporte integrado a EPUB e PDF com tipografia customizável, modo sépia/noturno e virada realista de páginas com foco imersivo.
            </p>
          </div>

          <!-- Pilar 2: Notas Ativas em Markdown -->
          <div class="p-6 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-divider flex flex-col gap-3 hover:border-accent/40 transition-colors">
            <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <FileTextIcon class="w-5 h-5" />
            </div>
            <h3 class="font-editorial text-lg font-light text-textPrimary">2. Notas Ativas</h3>
            <p class="font-interface text-xs text-textSecondary leading-relaxed">
              Destaques automáticos e anotações em Markdown formuladas com suas próprias palavras para garantir processamento semântico profundo.
            </p>
          </div>

          <!-- Pilar 3: Canvas Espacial Infinito -->
          <div class="p-6 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-divider flex flex-col gap-3 hover:border-accent/40 transition-colors">
            <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <LayersIcon class="w-5 h-5" />
            </div>
            <h3 class="font-editorial text-lg font-light text-textPrimary">3. Canvas Espacial</h3>
            <p class="font-interface text-xs text-textSecondary leading-relaxed">
              Organize visualmente notas, cartões e conexões conceituais em um quadro infinito compatível com JSON .canvas do Obsidian.
            </p>
          </div>

          <!-- Pilar 4: Retenção & Repetição Espaçada -->
          <div class="p-6 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-divider flex flex-col gap-3 hover:border-accent/40 transition-colors">
            <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <BrainIcon class="w-5 h-5" />
            </div>
            <h3 class="font-editorial text-lg font-light text-textPrimary">4. Retenção Permanente</h3>
            <p class="font-interface text-xs text-textSecondary leading-relaxed">
              Flashcards de repetição espaçada e combate empírico à Curva de Esquecimento de Ebbinghaus para reter o conhecimento para sempre.
            </p>
          </div>
        </div>
      </section>

      <!-- 8. SEÇÃO DE CONVERSÃO / EXPERIMENTE O ARESTA (CHAMADA PARA AÇÃO COM LINKS DEDICADOS) -->
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

    <!-- Canvas Lateral de Feedback & Sugestões de Melhoria -->
    <FeedbackCanvas
      v-model:is-open="isFeedbackCanvasOpen"
      @close="isFeedbackCanvasOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import {
  ArrowRightIcon,
  BookOpenIcon,
  FileTextIcon,
  SparklesIcon,
  BrainIcon,
  LayersIcon,
  CheckCircle2Icon,
  SearchIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  ZapIcon,
  LibraryIcon,
  NetworkIcon,
  InfoIcon,
  UploadIcon,
  SunIcon,
  MoonIcon,
  PaletteIcon,
  MessageSquareIcon
} from 'lucide-vue-next'
import FeedbackCanvas from '~/components/FeedbackCanvas.vue'
import ReadingStreak from '~/components/ReadingStreak.vue'
import EbbinghausChart from '~/components/EbbinghausChart.vue'
import ArestaLogoGraph from '~/components/ArestaLogoGraph.vue'
import HomeKnowledgeGraphDemo from '~/components/HomeKnowledgeGraphDemo.vue'
import HomeCanvasNotesDemo from '~/components/HomeCanvasNotesDemo.vue'
import UnifiedCanvasHub from '~/components/canvas/UnifiedCanvasHub.vue'
import { useAuth } from '~/composables/useAuth'
import { useSettings } from '~/composables/useSettings'

// Otimização Completa de SEO para a Landing Page e Home do Aresta
if (typeof useHead === 'function') {
  useHead({
    title: 'Aresta — Retenção de Conhecimento, Leitura Profunda & Canvas Espacial',
    meta: [
      {
        name: 'description',
        content: 'Plataforma focada em retenção definitiva de conhecimento através de livros (EPUB e PDF), notas ativas em Markdown, canvas espacial e repetição espaçada.'
      },
      {
        name: 'keywords',
        content: 'retenção de conhecimento, notas ativas, canvas espacial, leitura profunda, segundo cérebro, pkm, epub reader, leitor pdf, curva de esquecimento, flashcards, repetição espaçada, minimalismo digital, foco, estudos, aprendizado'
      },
      { property: 'og:title', content: 'Aresta — Retenção de Conhecimento, Leitura Profunda & Canvas Espacial' },
      {
        property: 'og:description',
        content: 'Plataforma focada em retenção definitiva de conhecimento através de livros, notas ativas em Markdown e canvas espacial.'
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Aresta — Retenção de Conhecimento, Leitura Profunda & Canvas Espacial' },
      {
        name: 'twitter:description',
        content: 'Plataforma focada em retenção definitiva de conhecimento através de livros, notas ativas em Markdown e canvas espacial.'
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
const { themeMode, toggleThemeMode } = useSettings()
const isFeedbackCanvasOpen = ref(false)

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

onMounted(() => {
  if (auth.isLoggedIn.value) {
    resetScrollToTop()
  }
})
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.custom-scrollbar::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
</style>

