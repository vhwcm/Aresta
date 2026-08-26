<template>
  <div class="flex flex-col gap-16 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto w-full">
    <!-- Header do Ensaio -->
    <header class="flex flex-col gap-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-accent"></div>
          Ensaio Cognitivo · Neurociência da Leitura
        </div>
        <div class="flex items-center gap-3 text-textSecondary font-technical text-xs">
          <span class="flex items-center gap-1">
            <ClockIcon class="w-3.5 h-3.5 text-accent" />
            6 min de leitura
          </span>
          <span>·</span>
          <span class="flex items-center gap-1">
            <BrainIcon class="w-3.5 h-3.5 text-accent" />
            Resistência Cognitiva
          </span>
        </div>
      </div>

      <h1 class="font-editorial text-4xl sm:text-5xl md:text-6xl font-light text-textPrimary leading-tight">
        Por que ler ainda importa <span class="text-accent italic font-normal">(e como isso resgata seu cérebro)</span>
      </h1>

      <!-- Intro Highlights / Subtitle -->
      <div class="p-6 md:p-8 rounded-2xl bg-white/[0.03] border border-divider flex flex-col gap-4 backdrop-blur-xl relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <p class="font-interface text-lg sm:text-xl text-textPrimary leading-relaxed relative z-10 font-light">
          Nossa atenção está sob ataque. A cada scroll na tela e a cada notificação, recebemos uma microdose de recompensa que condiciona o cérebro a buscar estímulos cada vez mais rápidos e fáceis. Nesse cenário, abrir um livro deixou de ser apenas um passatempo. <strong class="font-semibold text-accent">Virou um ato de resistência cognitiva.</strong>
        </p>
        <p class="font-interface text-base sm:text-lg text-textSecondary leading-relaxed relative z-10">
          Ler exige que você pise no freio e reaprenda a sustentar o foco. E o que acontece na sua cabeça quando você decide desacelerar muda o jogo completamente.
        </p>
      </div>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- Conteúdo Principal / Seções -->
    <article class="flex flex-col gap-16 font-interface text-textPrimary text-base sm:text-lg leading-relaxed">

      <!-- Seção 1: O fim do conhecimento raso -->
      <section class="flex flex-col gap-6 group">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-white/5 border border-divider flex items-center justify-center text-accent font-technical text-xs font-bold">
            01
          </div>
          <h2 class="font-editorial text-3xl sm:text-4xl font-light text-textPrimary group-hover:text-accent transition-colors">
            O fim do conhecimento raso
          </h2>
        </div>

        <p class="text-textSecondary leading-relaxed">
          Consumir vídeos curtos, posts rápidos ou resumos em áudio dá a ilusão de aprendizado, mas entrega apenas informação fragmentada. É a leitura focada — especialmente de textos e livros técnicos — que constrói um repertório denso.
        </p>

        <p class="text-textSecondary leading-relaxed">
          Ler exige processamento ativo. Você precisa decodificar a linguagem, conectar ideias aos conhecimentos que já possui e questionar argumentos em tempo real. Isso desenvolve um raciocínio crítico que nenhum conteúdo mastigado de cinco minutos consegue oferecer. O conhecimento sólido não aceita atalhos; ele precisa da fricção e do tempo que só a leitura profunda proporciona para se fixar na memória.
        </p>

        <!-- Card de Destaque: Fricção vs Atalhos -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col gap-2">
            <span class="font-technical text-[10px] uppercase tracking-widest text-textSecondary flex items-center gap-1.5">
              <ZapOffIcon class="w-3.5 h-3.5 text-red-400/80" />
              Consumo Passivo
            </span>
            <h4 class="font-editorial text-xl text-textPrimary">Informação Fragmentada</h4>
            <p class="text-xs text-textSecondary leading-normal">
              Ilusão de aprendizado através de feeds instantâneos. Baixa retenção na memória de longo prazo e falta de síntese crítica.
            </p>
          </div>
          <div class="p-6 rounded-2xl bg-accent/5 border border-accent/20 flex flex-col gap-2">
            <span class="font-technical text-[10px] uppercase tracking-widest text-accent flex items-center gap-1.5">
              <BrainIcon class="w-3.5 h-3.5 text-accent" />
              Leitura Focada
            </span>
            <h4 class="font-editorial text-xl text-textPrimary">Repertório Denso</h4>
            <p class="text-xs text-textSecondary leading-normal">
              Decodificação ativa, conexão profunda de conceitos e construção de pensamento crítico que não aceita atalhos.
            </p>
          </div>
        </div>
      </section>

      <div class="h-px bg-divider/50 w-full"></div>

      <!-- Seção 2: O poder da "baixa dopamina" -->
      <section class="flex flex-col gap-6 group">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-white/5 border border-divider flex items-center justify-center text-accent font-technical text-xs font-bold">
            02
          </div>
          <h2 class="font-editorial text-3xl sm:text-4xl font-light text-textPrimary group-hover:text-accent transition-colors">
            O poder da "baixa dopamina"
          </h2>
        </div>

        <p class="text-textSecondary leading-relaxed">
          As redes sociais e os aplicativos operam em ciclos de alta dopamina, entregando picos rápidos, intensos e "baratos" de prazer. O livro faz exatamente o oposto: ele é um estímulo de baixa dopamina, lento, contínuo e que exige trabalho.
        </p>

        <p class="text-textSecondary leading-relaxed">
          Ao forçar sua mente a se manter engajada em uma página que não pisca, não emite sons e não muda de cor, você treina sua tolerância ao esforço mental. Você está ensinando o seu sistema de recompensa a encontrar satisfação na jornada e na superação do tédio, e não apenas no alívio imediato do próximo clique. É, na prática, musculação para a sua capacidade de atenção.
        </p>

        <!-- Quote Block -->
        <blockquote class="my-2 p-6 md:p-8 border-l-2 border-accent bg-white/[0.02] rounded-r-2xl font-editorial text-2xl text-textPrimary italic font-light leading-relaxed">
          "Ao forçar sua mente a se manter engajada em uma página que não pisca, não emite sons e não muda de cor, você treina sua tolerância ao esforço mental."
        </blockquote>
      </section>

      <div class="h-px bg-divider/50 w-full"></div>

      <!-- Seção 3: O simulador de realidades -->
      <section class="flex flex-col gap-6 group">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-white/5 border border-divider flex items-center justify-center text-accent font-technical text-xs font-bold">
            03
          </div>
          <h2 class="font-editorial text-3xl sm:text-4xl font-light text-textPrimary group-hover:text-accent transition-colors">
            O simulador de realidades
          </h2>
        </div>

        <p class="text-textSecondary leading-relaxed">
          Quando entramos no campo da literatura e da ficção, a leitura ganha uma função diferente. Ler histórias é o simulador de empatia e cognição mais potente que conhecemos.
        </p>

        <p class="text-textSecondary leading-relaxed">
          Ao entrar na cabeça de um personagem, você assume pontos de vista, vivências e realidades que nunca experimentaria na sua própria bolha. Do ponto de vista neurológico, isso flexibiliza seu pensamento. Viver várias vidas através das páginas quebra preconceitos cognitivos e nos torna leitores melhores não apenas de textos, mas das emoções humanas e da complexidade do mundo ao nosso redor.
        </p>
      </section>

      <div class="h-px bg-divider/50 w-full"></div>

      <!-- Seção 4: Onde aprender mais -->
      <section class="flex flex-col gap-6 group">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-white/5 border border-divider flex items-center justify-center text-accent font-technical text-xs font-bold">
            04
          </div>
          <h2 class="font-editorial text-3xl sm:text-4xl font-light text-textPrimary group-hover:text-accent transition-colors">
            Onde aprender mais
          </h2>
        </div>

        <p class="text-textSecondary leading-relaxed">
          Resgatar o hábito da leitura é retomar o controle sobre a própria mente. Entender a mecânica do seu cérebro ajuda muito nesse processo.
        </p>

        <div class="p-8 rounded-3xl bg-gradient-to-br from-accent/10 via-bgPanel to-bgPanel border border-accent/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div class="flex flex-col gap-3 relative z-10 max-w-xl">
            <div class="font-technical text-[10px] uppercase tracking-widest text-accent font-semibold flex items-center gap-2">
              <CompassIcon class="w-4 h-4" />
              Recomendação Especial
            </div>
            <h3 class="font-editorial text-2xl sm:text-3xl font-light text-textPrimary">
              Reservatório de Dopamina (RD)
            </h3>
            <p class="text-sm text-textSecondary leading-relaxed">
              Se você quer aprofundar seu entendimento sobre como a atenção funciona e como recalibrar seus comportamentos diante de tanta hiperestimulação, recomendo fortemente que acompanhe o Reservatório de Dopamina (RD). O canal é hoje a melhor e mais confiável fonte para estudar neurociência, psicologia e saúde de forma prática, traduzindo ciência de verdade para o dia a dia, sem falsas promessas.
            </p>
          </div>
          <div class="shrink-0 relative z-10">
            <div class="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-lg">
              <BrainIcon class="w-8 h-8" />
            </div>
          </div>
        </div>
      </section>

      <div class="h-px bg-divider w-full"></div>

      <!-- Seção 5: Referências e Leituras de Apoio -->
      <section class="flex flex-col gap-8">
        <div class="flex flex-col gap-2">
          <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
            <BookOpenIcon class="w-3.5 h-3.5 text-accent" />
            Fundamentos & Bibliografia
          </div>
          <h2 class="font-editorial text-3xl font-light text-textPrimary">
            Referências e Leituras de Apoio
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

          <!-- Ref 1 -->
          <div class="p-6 rounded-2xl bg-white/[0.03] border border-divider hover:bg-white/[0.06] transition-all duration-300 flex flex-col gap-3 group">
            <div class="flex items-center justify-between">
              <span class="font-technical text-[10px] uppercase font-bold tracking-widest text-accent">Plataforma / Canal</span>
              <ExternalLinkIcon class="w-4 h-4 text-textSecondary group-hover:text-accent transition-colors" />
            </div>
            <h4 class="font-editorial text-xl font-light text-textPrimary group-hover:text-accent transition-colors">
              Reservatório de Dopamina
            </h4>
            <p class="text-xs text-textSecondary leading-relaxed">
              Plataforma e canal de referência (criado por Eslen Delanare) em estudos práticos sobre regulação do sistema de recompensa, neurociência do comportamento, foco e disciplina.
            </p>
          </div>

          <!-- Ref 2 -->
          <div class="p-6 rounded-2xl bg-white/[0.03] border border-divider hover:bg-white/[0.06] transition-all duration-300 flex flex-col gap-3 group">
            <div class="flex items-center justify-between">
              <span class="font-technical text-[10px] uppercase font-bold tracking-widest text-accent">Livro · Anna Lembke</span>
              <BookIcon class="w-4 h-4 text-textSecondary group-hover:text-accent transition-colors" />
            </div>
            <h4 class="font-editorial text-xl font-light text-textPrimary group-hover:text-accent transition-colors">
              Nação Dopamina
            </h4>
            <p class="text-xs text-textSecondary leading-relaxed">
              Obra essencial para entender a dinâmica de prazer, dor e vício em estímulos rápidos no mundo contemporâneo.
            </p>
          </div>

          <!-- Ref 3 -->
          <div class="p-6 rounded-2xl bg-white/[0.03] border border-divider hover:bg-white/[0.06] transition-all duration-300 flex flex-col gap-3 group">
            <div class="flex items-center justify-between">
              <span class="font-technical text-[10px] uppercase font-bold tracking-widest text-accent">Psicologia Cognitiva</span>
              <BrainIcon class="w-4 h-4 text-textSecondary group-hover:text-accent transition-colors" />
            </div>
            <h4 class="font-editorial text-xl font-light text-textPrimary group-hover:text-accent transition-colors">
              Estudos sobre Teoria da Mente na Ficção
            </h4>
            <p class="text-xs text-textSecondary leading-relaxed">
              Pesquisas em psicologia cognitiva que demonstram como ler literatura melhora a capacidade de mapear e compreender emoções e intenções de outras pessoas.
            </p>
          </div>

          <!-- Ref 4 -->
          <div class="p-6 rounded-2xl bg-white/[0.03] border border-divider hover:bg-white/[0.06] transition-all duration-300 flex flex-col gap-3 group">
            <div class="flex items-center justify-between">
              <span class="font-technical text-[10px] uppercase font-bold tracking-widest text-accent">Livro · Daniel Goleman</span>
              <BookIcon class="w-4 h-4 text-textSecondary group-hover:text-accent transition-colors" />
            </div>
            <h4 class="font-editorial text-xl font-light text-textPrimary group-hover:text-accent transition-colors">
              Foco
            </h4>
            <p class="text-xs text-textSecondary leading-relaxed">
              Base teórica sólida sobre a mecânica da atenção sustentada e como a capacidade de concentração determina nosso desempenho.
            </p>
          </div>

        </div>
      </section>

    </article>
  </div>
</template>

<script setup lang="ts">
import {
  ClockIcon,
  BrainIcon,
  ZapOffIcon,
  CompassIcon,
  BookOpenIcon,
  ExternalLinkIcon,
  BookIcon
} from 'lucide-vue-next'
</script>
