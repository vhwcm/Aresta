<template>
  <div class="min-h-screen bg-[#07090E] text-textPrimary flex flex-col justify-between p-4 sm:p-6 md:p-10 relative overflow-hidden font-interface select-none">
    <!-- Efeito de Iluminação de Fundo -->
    <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-accent/15 via-accent/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-0 -left-20 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Header do Painel com Barra de Progresso e Passo Atual -->
    <header class="w-full max-w-4xl mx-auto flex flex-col gap-4 relative z-10">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-technical text-xs font-bold shadow-lg shadow-accent/20">
            A
          </div>
          <span class="font-editorial text-lg text-white font-light tracking-wide">Aresta</span>
          <span class="text-white/30 text-xs">·</span>
          <span class="font-technical text-[11px] uppercase tracking-widest text-white/50">Boas-vindas</span>
        </div>

        <!-- Indicador Numérico do Passo -->
        <div class="flex items-center gap-3">
          <div class="font-technical text-xs text-white/70">
            <span class="text-accent font-semibold">{{ currentStep }}</span>
            <span class="text-white/30"> / {{ totalSteps }}</span>
          </div>

          <button
            v-if="currentStep < totalSteps"
            @click="skipToFinish"
            class="text-xs text-white/40 hover:text-white/80 transition-colors underline-offset-4 hover:underline py-1 px-2 cursor-pointer"
          >
            Pular para o fim
          </button>
        </div>
      </div>

      <!-- Barra de Progresso Segmentada -->
      <div class="w-full grid grid-cols-5 gap-2">
        <div
          v-for="step in totalSteps"
          :key="step"
          class="h-1.5 rounded-full transition-all duration-500"
          :class="[
            step === currentStep ? 'bg-accent shadow-sm shadow-accent/50' :
            step < currentStep ? 'bg-accent/60' : 'bg-white/10'
          ]"
        ></div>
      </div>
    </header>

    <!-- Conteúdo Principal: Carrossel de Quadros -->
    <main class="w-full max-w-4xl mx-auto my-auto py-8 relative z-10 flex flex-col justify-center">
      <transition name="carousel" mode="out-in">
        <!-- QUADRO 1: Nome de Exibição (Display Name) -->
        <div v-if="currentStep === 1" key="step-1" class="flex flex-col gap-8">
          <div class="flex flex-col gap-2.5 text-center md:text-left">
            <div class="inline-flex items-center gap-2 self-center md:self-start px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent font-technical text-[10px] uppercase tracking-widest font-semibold">
              <UserIcon class="w-3.5 h-3.5" />
              Sua Identidade Intelectual
            </div>
            <h1 class="font-editorial text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight">
              Como devemos chamar você no <span class="text-accent italic font-normal">Aresta</span>?
            </h1>
            <p class="text-white/60 text-sm sm:text-base max-w-2xl leading-relaxed">
              Defina seu nome de exibição. Ele dará autoria às suas anotações, mapas de conhecimento e à sua estante pessoal.
            </p>
          </div>

          <!-- Card Central de Configuração do Nome -->
          <div class="p-6 sm:p-8 rounded-3xl bg-zinc-900/70 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row gap-8 items-center">
            <!-- Preview do Perfil -->
            <div class="flex flex-col items-center gap-3 shrink-0 p-6 rounded-2xl bg-black/40 border border-white/5 w-full md:w-64 text-center">
              <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/40 text-accent font-technical text-2xl font-bold flex items-center justify-center shadow-lg shadow-accent/20">
                {{ userInitials }}
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="font-editorial text-xl text-white font-medium truncate max-w-[180px]">
                  {{ displayName || 'Seu Nome' }}
                </span>
                <span class="font-interface text-[11px] text-white/40 truncate max-w-[180px]">
                  {{ userEmail }}
                </span>
                <span class="mt-2 inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-technical text-[9px] uppercase tracking-wider font-semibold">
                  Leitor Ativo
                </span>
              </div>
            </div>

            <!-- Campo de Input com Limite Estrito de Caracteres -->
            <div class="flex flex-col gap-4 w-full">
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <label for="display-name-input" class="font-technical text-[11px] uppercase tracking-widest text-white/70 font-semibold">
                    Nome de Exibição
                  </label>
                  <!-- Contador de Caracteres -->
                  <div
                    class="font-technical text-xs transition-colors"
                    :class="[
                      displayName.length >= 30 ? 'text-amber-400 font-semibold' :
                      displayName.length > 25 ? 'text-amber-400/80' : 'text-white/40'
                    ]"
                  >
                    <span>{{ displayName.length }}</span> / <span>30 caracteres</span>
                  </div>
                </div>

                <div class="relative">
                  <input
                    id="display-name-input"
                    v-model="displayName"
                    type="text"
                    maxlength="30"
                    data-testid="onboarding-display-name-input"
                    placeholder="Ex: Viktor, Sofia, Leonardo..."
                    class="w-full bg-black/50 border rounded-2xl px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:outline-none transition-all shadow-inner"
                    :class="displayName.trim().length === 0 ? 'border-white/15 focus:border-accent' : 'border-accent/50 focus:border-accent shadow-accent/5'"
                  />
                  <div v-if="displayName.length >= 30" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-technical uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                    Limite
                  </div>
                </div>
                <p class="text-xs text-white/40 leading-normal">
                  Máximo de 30 caracteres. Você pode alterar esse nome a qualquer momento nas configurações da sua conta.
                </p>
              </div>

              <!-- Dica de Privacidade -->
              <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-xs text-white/60">
                <ShieldCheckIcon class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Seus dados e anotações são confidenciais e sincronizados diretamente com seu próprio armazenamento em nuvem.
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- QUADRO 2: O que Incentivou & O que Busca -->
        <div v-else-if="currentStep === 2" key="step-2" class="flex flex-col gap-8">
          <div class="flex flex-col gap-2.5 text-center md:text-left">
            <div class="inline-flex items-center gap-2 self-center md:self-start px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent font-technical text-[10px] uppercase tracking-widest font-semibold">
              <CompassIcon class="w-3.5 h-3.5" />
              Sua Intenção & Objetivos
            </div>
            <h1 class="font-editorial text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight">
              O que trouxe você ao <span class="text-accent italic font-normal">Aresta</span>?
            </h1>
            <p class="text-white/60 text-sm sm:text-base max-w-2xl leading-relaxed">
              Entender sua meta nos permite destacar as ferramentas mais valiosas para a sua rotina.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Coluna A: O que incentivou -->
            <div class="flex flex-col gap-3">
              <span class="font-technical text-xs uppercase tracking-wider text-white/70 font-semibold flex items-center gap-2">
                <SparklesIcon class="w-3.5 h-3.5 text-accent" />
                O que incentivou a criar sua conta?
              </span>

              <div class="flex flex-col gap-2.5">
                <button
                  v-for="item in motivationsList"
                  :key="item.id"
                  type="button"
                  @click="toggleMotivation(item.id)"
                  class="p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer group"
                  :class="[
                    selectedMotivations.includes(item.id)
                      ? 'bg-accent/15 border-accent text-white shadow-md shadow-accent/10'
                      : 'bg-zinc-900/60 border-white/10 hover:border-white/20 text-white/70 hover:text-white'
                  ]"
                >
                  <span class="text-xl shrink-0">{{ item.icon }}</span>
                  <div class="flex flex-col">
                    <span class="font-medium text-xs sm:text-sm text-white">{{ item.title }}</span>
                    <span class="text-[11px] text-white/50">{{ item.desc }}</span>
                  </div>
                  <CheckIcon
                    class="w-4 h-4 ml-auto shrink-0 transition-opacity"
                    :class="selectedMotivations.includes(item.id) ? 'opacity-100 text-accent' : 'opacity-0'"
                  />
                </button>
              </div>
            </div>

            <!-- Coluna B: O que você busca alcançar -->
            <div class="flex flex-col gap-3">
              <span class="font-technical text-xs uppercase tracking-wider text-white/70 font-semibold flex items-center gap-2">
                <TargetIcon class="w-3.5 h-3.5 text-emerald-400" />
                O que você busca alcançar aqui?
              </span>

              <div class="flex flex-col gap-2.5">
                <button
                  v-for="item in goalsList"
                  :key="item.id"
                  type="button"
                  @click="toggleGoal(item.id)"
                  class="p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer group"
                  :class="[
                    selectedGoals.includes(item.id)
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-zinc-900/60 border-white/10 hover:border-white/20 text-white/70 hover:text-white'
                  ]"
                >
                  <span class="text-xl shrink-0">{{ item.icon }}</span>
                  <div class="flex flex-col">
                    <span class="font-medium text-xs sm:text-sm text-white">{{ item.title }}</span>
                    <span class="text-[11px] text-white/50">{{ item.desc }}</span>
                  </div>
                  <CheckIcon
                    class="w-4 h-4 ml-auto shrink-0 transition-opacity"
                    :class="selectedGoals.includes(item.id) ? 'opacity-100 text-emerald-400' : 'opacity-0'"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- QUADRO 3: Benefícios da Leitura (Neurociência) -->
        <div v-else-if="currentStep === 3" key="step-3" class="flex flex-col gap-8">
          <div class="flex flex-col gap-2.5 text-center md:text-left">
            <div class="inline-flex items-center gap-2 self-center md:self-start px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent font-technical text-[10px] uppercase tracking-widest font-semibold">
              <BrainIcon class="w-3.5 h-3.5" />
              Neurociência da Leitura Ativa
            </div>
            <h1 class="font-editorial text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight">
              Por que ler é um ato de <span class="text-accent italic font-normal">resistência cognitiva</span>
            </h1>
            <p class="text-white/60 text-sm sm:text-base max-w-2xl leading-relaxed">
              Em um mundo desenhado para fragmentar sua atenção com estímulos rápidos, o livro resgata a capacidade de pensar com profundidade.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <!-- Card 1: Foco e Neuroplasticidade -->
            <div class="p-6 rounded-3xl bg-zinc-900/70 border border-white/10 flex flex-col gap-4 backdrop-blur-xl relative overflow-hidden group hover:border-accent/40 transition-colors">
              <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-bold">
                <BrainIcon class="w-5 h-5" />
              </div>
              <div class="flex flex-col gap-1.5">
                <h3 class="font-editorial text-xl text-white">Neuroplasticidade & Foco</h3>
                <span class="font-technical text-[10px] uppercase tracking-wider text-accent">Atenção Sustentada</span>
              </div>
              <p class="text-xs sm:text-sm text-white/60 leading-relaxed">
                A leitura linear fortalece os circuitos pré-frontais do cérebro, treinando sua mente para sustentar concentração prolongada sem pular de distração em distração.
              </p>
            </div>

            <!-- Card 2: Conhecimento Denso vs Raso -->
            <div class="p-6 rounded-3xl bg-zinc-900/70 border border-white/10 flex flex-col gap-4 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
              <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                <LayersIcon class="w-5 h-5" />
              </div>
              <div class="flex flex-col gap-1.5">
                <h3 class="font-editorial text-xl text-white">Repertório Denso</h3>
                <span class="font-technical text-[10px] uppercase tracking-wider text-emerald-400">O Fim do Conteúdo Raso</span>
              </div>
              <p class="text-xs sm:text-sm text-white/60 leading-relaxed">
                Vídeos de 30 segundos oferecem ilusão de aprendizado. O texto exige decodificação ativa e questionamento crítico, fixando modelos mentais de longo prazo.
              </p>
            </div>

            <!-- Card 3: Baixa Dopamina -->
            <div class="p-6 rounded-3xl bg-zinc-900/70 border border-white/10 flex flex-col gap-4 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/40 transition-colors">
              <div class="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                <SparklesIcon class="w-5 h-5" />
              </div>
              <div class="flex flex-col gap-1.5">
                <h3 class="font-editorial text-xl text-white">Baixa Dopamina</h3>
                <span class="font-technical text-[10px] uppercase tracking-wider text-blue-400">Clareza & Serenidade</span>
              </div>
              <p class="text-xs sm:text-sm text-white/60 leading-relaxed">
                Desacelerar o ritmo reduz drasticamente a ansiedade provocada pela busca contínua por novidades efêmeras, restaurando a paz de espírito.
              </p>
            </div>
          </div>
        </div>

        <!-- QUADRO 4: Benefícios do App Aresta -->
        <div v-else-if="currentStep === 4" key="step-4" class="flex flex-col gap-8">
          <div class="flex flex-col gap-2.5 text-center md:text-left">
            <div class="inline-flex items-center gap-2 self-center md:self-start px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent font-technical text-[10px] uppercase tracking-widest font-semibold">
              <BookOpenIcon class="w-3.5 h-3.5" />
              O Ecossistema Aresta
            </div>
            <h1 class="font-editorial text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight">
              O que o <span class="text-accent italic font-normal">Aresta</span> permite que você faça
            </h1>
            <p class="text-white/60 text-sm sm:text-base max-w-2xl leading-relaxed">
              Criamos uma plataforma unificada que transforma cada página lida em conhecimento conectado e memorável.
            </p>
          </div>

          <!-- Grade de Recursos do App -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-start gap-4">
              <div class="p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent shrink-0">
                <BookOpenIcon class="w-5 h-5" />
              </div>
              <div class="flex flex-col gap-1">
                <h4 class="font-editorial text-lg text-white font-medium">Leitor Universal 3D (EPUB & PDF)</h4>
                <p class="text-xs text-white/60 leading-relaxed">
                  Experiência tátil com virada de página física em 3D, tipografia editorial pura e modo Zen imersivo e livre de distrações.
                </p>
              </div>
            </div>

            <div class="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-start gap-4">
              <div class="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                <NetworkIcon class="w-5 h-5" />
              </div>
              <div class="flex flex-col gap-1">
                <h4 class="font-editorial text-lg text-white font-medium">Grafo de Conhecimento & Canvas</h4>
                <p class="text-xs text-white/60 leading-relaxed">
                  Seus grifos e reflexões não morrem esquecidos: formam uma teia conceitual navegável (PKM) conectando ideias entre livros.
                </p>
              </div>
            </div>

            <div class="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-start gap-4">
              <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <ZapIcon class="w-5 h-5" />
              </div>
              <div class="flex flex-col gap-1">
                <h4 class="font-editorial text-lg text-white font-medium">Flashcards com Repetição Espaçada</h4>
                <p class="text-xs text-white/60 leading-relaxed">
                  Sistema SRS integrado baseado na Curva do Esquecimento para revisar e fixar conceitos essenciais no momento ideal.
                </p>
              </div>
            </div>

            <div class="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-start gap-4">
              <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <CloudIcon class="w-5 h-5" />
              </div>
              <div class="flex flex-col gap-1">
                <h4 class="font-editorial text-lg text-white font-medium">Local-First & Nuvem Transparente</h4>
                <p class="text-xs text-white/60 leading-relaxed">
                  Total controle e privacidade. Sincronização direta com Google Drive e OneDrive mantendo seus arquivos sob seu domínio.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- QUADRO 5: Como Funciona a Ofensiva & Meta Semanal -->
        <div v-else-if="currentStep === 5" key="step-5" class="flex flex-col gap-8">
          <div class="flex flex-col gap-2.5 text-center md:text-left">
            <div class="inline-flex items-center gap-2 self-center md:self-start px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 font-technical text-[10px] uppercase tracking-widest font-semibold">
              <FlameIcon class="w-3.5 h-3.5" />
              A Ofensiva & Hábito Diário
            </div>
            <h1 class="font-editorial text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight">
              Como funciona a <span class="text-amber-400 italic font-normal">Ofensiva</span> e sua meta
            </h1>
            <p class="text-white/60 text-sm sm:text-base max-w-2xl leading-relaxed">
              A constância supera a intensidade esporádica. A ofensiva é o seu guardião diário contra a procrastinação.
            </p>
          </div>

          <!-- Explicação Didática da Ofensiva -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2">
              <div class="flex items-center gap-2 text-amber-400">
                <FlameIcon class="w-4 h-4" />
                <span class="font-technical text-xs uppercase font-semibold">O que é a Chama</span>
              </div>
              <p class="text-xs text-white/60 leading-relaxed">
                Contagem contínua de dias em que você realizou atividades intelectuais. Quanto maior a sequência, mais consolidado é o hábito.
              </p>
            </div>

            <div class="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2">
              <div class="flex items-center gap-2 text-emerald-400">
                <CheckCircle2Icon class="w-4 h-4" />
                <span class="font-technical text-xs uppercase font-semibold">Como Pontuar no Dia</span>
              </div>
              <p class="text-xs text-white/60 leading-relaxed">
                Basta ler por pelo menos <strong class="text-white">15 minutos</strong> no leitor OU revisar a sua sessão diária de <strong class="text-white">flashcards</strong>.
              </p>
            </div>

            <div class="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2">
              <div class="flex items-center gap-2 text-blue-400">
                <SnowflakeIcon class="w-4 h-4" />
                <span class="font-technical text-xs uppercase font-semibold">Congelamentos</span>
              </div>
              <p class="text-xs text-white/60 leading-relaxed">
                Imprevistos acontecem. Você conta com proteções de congelamento para dias atípicos ou pausas programadas sem perder seu progresso.
              </p>
            </div>
          </div>

          <!-- Seletor de Meta Semanal de Dias -->
          <div class="flex flex-col gap-3">
            <span class="font-technical text-xs uppercase tracking-wider text-white/70 font-semibold">
              Defina sua meta semanal de leitura:
            </span>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Meta 3 Dias -->
              <button
                type="button"
                @click="targetStreakDays = 3"
                data-testid="target-streak-3"
                class="p-5 rounded-2xl border text-left transition-all flex flex-col gap-2 cursor-pointer relative group"
                :class="[
                  targetStreakDays === 3
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-zinc-900/60 border-white/10 hover:border-white/20 text-white/70'
                ]"
              >
                <div class="flex items-center justify-between">
                  <span class="font-technical text-xs uppercase tracking-wider text-amber-400 font-semibold">Ritmo Leve</span>
                  <div class="w-4 h-4 rounded-full border flex items-center justify-center" :class="targetStreakDays === 3 ? 'border-amber-400 bg-amber-400' : 'border-white/20'">
                    <div v-if="targetStreakDays === 3" class="w-1.5 h-1.5 rounded-full bg-black"></div>
                  </div>
                </div>
                <div class="font-editorial text-3xl text-white font-light">3 dias <span class="text-xs font-interface text-white/40">/ semana</span></div>
                <p class="text-[11px] text-white/50">Perfeito para quem está recomeçando a criar tempo para os livros.</p>
              </button>

              <!-- Meta 5 Dias -->
              <button
                type="button"
                @click="targetStreakDays = 5"
                data-testid="target-streak-5"
                class="p-5 rounded-2xl border text-left transition-all flex flex-col gap-2 cursor-pointer relative group"
                :class="[
                  targetStreakDays === 5
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-zinc-900/60 border-white/10 hover:border-white/20 text-white/70'
                ]"
              >
                <div class="flex items-center justify-between">
                  <span class="font-technical text-xs uppercase tracking-wider text-amber-400 font-semibold">Ritmo Focado</span>
                  <div class="w-4 h-4 rounded-full border flex items-center justify-center" :class="targetStreakDays === 5 ? 'border-amber-400 bg-amber-400' : 'border-white/20'">
                    <div v-if="targetStreakDays === 5" class="w-1.5 h-1.5 rounded-full bg-black"></div>
                  </div>
                </div>
                <div class="font-editorial text-3xl text-white font-light">5 dias <span class="text-xs font-interface text-white/40">/ semana</span></div>
                <p class="text-[11px] text-white/50">Leitura consistente nos dias úteis com fins de semana flexíveis.</p>
              </button>

              <!-- Meta 7 Dias (Recomendado) -->
              <button
                type="button"
                @click="targetStreakDays = 7"
                data-testid="target-streak-7"
                class="p-5 rounded-2xl border text-left transition-all flex flex-col gap-2 cursor-pointer relative group"
                :class="[
                  targetStreakDays === 7
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-xl shadow-amber-500/15 ring-1 ring-amber-500/40'
                    : 'bg-zinc-900/60 border-white/10 hover:border-white/20 text-white/70'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-technical text-[9px] uppercase tracking-wider font-semibold">
                    Recomendado
                  </div>
                  <div class="w-4 h-4 rounded-full border flex items-center justify-center" :class="targetStreakDays === 7 ? 'border-amber-400 bg-amber-400' : 'border-white/20'">
                    <div v-if="targetStreakDays === 7" class="w-1.5 h-1.5 rounded-full bg-black"></div>
                  </div>
                </div>
                <div class="font-editorial text-3xl text-white font-light">7 dias <span class="text-xs font-interface text-white/40">/ diário</span></div>
                <p class="text-[11px] text-white/50">Imersão completa. Um pequeno momento diário para transformar seu cérebro.</p>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </main>

    <!-- Rodapé: Botões de Navegação do Carrossel -->
    <footer class="w-full max-w-4xl mx-auto flex items-center justify-between pt-6 border-t border-white/10 relative z-10">
      <!-- Botão Voltar -->
      <div>
        <button
          v-if="currentStep > 1"
          type="button"
          @click="prevStep"
          data-testid="onboarding-prev-btn"
          class="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-interface text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeftIcon class="w-4 h-4" />
          <span>Voltar</span>
        </button>
      </div>

      <!-- Botão Próximo / Concluir -->
      <div class="flex items-center gap-3">
        <button
          v-if="currentStep < totalSteps"
          type="button"
          @click="nextStep"
          data-testid="onboarding-next-btn"
          class="px-6 py-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-interface text-xs sm:text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-accent/25 cursor-pointer"
        >
          <span>Continuar</span>
          <ArrowRightIcon class="w-4 h-4" />
        </button>

        <button
          v-else
          type="button"
          @click="finishOnboarding"
          :disabled="isSubmitting"
          data-testid="onboarding-finish-btn"
          class="px-8 py-3 rounded-xl bg-gradient-to-r from-accent via-amber-500 to-amber-600 hover:opacity-95 text-white font-interface text-xs sm:text-sm font-semibold transition-all flex items-center gap-2.5 shadow-xl shadow-accent/30 cursor-pointer disabled:opacity-50"
        >
          <span v-if="!isSubmitting">Concluir e Começar</span>
          <span v-else class="flex items-center gap-2">
            <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Salvando preferências...
          </span>
          <ArrowRightIcon v-if="!isSubmitting" class="w-4 h-4" />
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  UserIcon,
  ShieldCheckIcon,
  CompassIcon,
  SparklesIcon,
  TargetIcon,
  CheckIcon,
  BrainIcon,
  LayersIcon,
  BookOpenIcon,
  NetworkIcon,
  ZapIcon,
  CloudIcon,
  FlameIcon,
  CheckCircle2Icon,
  SnowflakeIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'

if (typeof useHead === 'function') {
  useHead({
    title: 'Bem-vindo ao Aresta — Configuração Inicial',
    meta: [
      {
        name: 'description',
        content: 'Configure sua identidade, conheça o ecossistema do Aresta e defina sua meta de ofensiva intelectual.'
      }
    ]
  })
}

const auth = useAuth()

const currentStep = ref(1)
const totalSteps = 5
const isSubmitting = ref(false)

const userEmail = computed(() => auth.user.value?.email || 'leitor@aresta.app')
const displayName = ref(auth.user.value?.name || 'Leitor')

const userInitials = computed(() => {
  const name = displayName.value.trim() || 'Aresta'
  const parts = name.split(' ')
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return `${parts[0][0]}${parts[parts.length - 1]![0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

// Opções de Motivação
const motivationsList = [
  { id: 'focus', icon: '🎯', title: 'Foco & Imersão', desc: 'Escapar de distrações e feeds rasos' },
  { id: 'retention', icon: '🧠', title: 'Retenção Duradoura', desc: 'Lembrar do que leio a longo prazo' },
  { id: 'pkm', icon: '🗺️', title: 'Segundo Cérebro', desc: 'Organizar notas e conexões conceituais' },
  { id: 'study', icon: '📚', title: 'Estudo Técnico', desc: 'EPUBs e PDFs com anotações densas' },
]
const selectedMotivations = ref<string[]>(['focus', 'retention'])

const toggleMotivation = (id: string) => {
  if (selectedMotivations.value.includes(id)) {
    selectedMotivations.value = selectedMotivations.value.filter(item => item !== id)
  } else {
    selectedMotivations.value.push(id)
  }
}

// Opções de Objetivos
const goalsList = [
  { id: 'daily_habit', icon: '📅', title: 'Hábito Diário', desc: 'Construir rotina consistente de leitura' },
  { id: 'centralize', icon: '🏛️', title: 'Biblioteca Central', desc: 'Todos meus livros e reflexões juntos' },
  { id: 'flashcards', icon: '⚡', title: 'Revisão com Flashcards', desc: 'Fixação de conceitos na memória' },
  { id: 'cloud', icon: '☁️', title: 'Liberdade em Nuvem', desc: 'Acesso seguro em qualquer dispositivo' },
]
const selectedGoals = ref<string[]>(['daily_habit', 'centralize'])

const toggleGoal = (id: string) => {
  if (selectedGoals.value.includes(id)) {
    selectedGoals.value = selectedGoals.value.filter(item => item !== id)
  } else {
    selectedGoals.value.push(id)
  }
}

// Meta Semanal de Ofensiva
const targetStreakDays = ref(7)

onMounted(() => {
  if (auth.user.value?.name) {
    displayName.value = auth.user.value.name.slice(0, 30)
  }
})

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const skipToFinish = () => {
  currentStep.value = totalSteps
}

const finishOnboarding = async () => {
  isSubmitting.value = true
  try {
    const cleanName = displayName.value.trim().slice(0, 30)

    // 1. Atualiza nome de exibição no backend se alterado ou não vazio
    if (cleanName && cleanName !== auth.user.value?.name) {
      await auth.updateProfile(cleanName)
    }

    // 2. Atualiza meta de streak no backend
    const authUrl = typeof useRuntimeConfig === 'function' && useRuntimeConfig()?.public?.authApiUrl
      ? useRuntimeConfig().public.authApiUrl
      : 'http://localhost:3001'

    if (auth.token.value) {
      try {
        await $fetch(`${authUrl}/api/users/me/streak/target`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${auth.token.value}` },
          body: { target_days: targetStreakDays.value }
        })
      } catch (err) {
        console.warn('Não foi possível salvar a meta de ofensiva imediatamente:', err)
      }
    }

    // 3. Marca onboarding como concluído
    auth.completeOnboarding(auth.user.value?.id)

    // 4. Redireciona para a página inicial
    if (typeof navigateTo === 'function') {
      await navigateTo('/', { replace: true })
    }
  } catch (e) {
    console.error('Erro ao finalizar onboarding:', e)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.carousel-enter-active,
.carousel-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.carousel-enter-from {
  opacity: 0;
  transform: translateX(24px) scale(0.98);
}

.carousel-leave-to {
  opacity: 0;
  transform: translateX(-24px) scale(0.98);
}
</style>
