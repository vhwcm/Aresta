<template>
  <div class="flex flex-col gap-14 pb-28 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto w-full">
    <!-- Cabeçalho do Ensaio / Explicação -->
    <header class="flex flex-col gap-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <NuxtLink
          to="/"
          class="font-technical text-xs text-textSecondary hover:text-textPrimary flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeftIcon class="w-3.5 h-3.5" />
          Voltar para o Início
        </NuxtLink>

        <div class="flex items-center gap-2 font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">
          <BrainIcon class="w-3.5 h-3.5" />
          Neurociência Cognitiva & Memória
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <h1 class="font-editorial text-4xl sm:text-5xl md:text-6xl font-light text-textPrimary leading-tight">
          A Curva do Esquecimento <span class="text-accent italic font-normal">de Hermann Ebbinghaus</span>
        </h1>
        <p class="font-interface text-base sm:text-lg text-textSecondary max-w-3xl leading-relaxed">
          Sem repetição, o cérebro humano descarta mais de <strong>70% das informações novas em menos de 48 horas</strong>. Entenda a matemática por trás da retenção e como o algoritmo de repetição espaçada do Aresta blinda sua memória.
        </p>
      </div>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <!-- SEÇÃO PRINCIPAL: GRÁFICO NATIVO INTERATIVO (D3.js) -->
    <section class="flex flex-col gap-6 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-divider shadow-2xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex flex-col">
          <span class="font-technical text-[10px] uppercase tracking-widest text-accent font-semibold flex items-center gap-1.5">
            Demonstração Prática & Simulação D3
          </span>
          <h2 class="font-editorial text-2xl font-light text-textPrimary">
            Decaimento Exponencial vs. Repetição Espaçada
          </h2>
        </div>

        <div class="flex items-center gap-2 text-xs text-textSecondary font-technical">
          <span>Hermann Ebbinghaus (1885)</span>
        </div>
      </div>

      <!-- Gráfico D3 -->
      <EbbinghausChart />

      <!-- Estatísticas Comparativas Rápidas -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-divider">
        <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col gap-1">
          <span class="font-technical text-[10px] uppercase text-rose-400 font-semibold">Sem Revisão (24h)</span>
          <span class="font-editorial text-2xl text-rose-300">~33% Retido</span>
          <span class="font-interface text-[11px] text-textSecondary">Dois terços do livro já foram esquecidos.</span>
        </div>

        <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1">
          <span class="font-technical text-[10px] uppercase text-amber-400 font-semibold">1ª Revisão (24h)</span>
          <span class="font-editorial text-2xl text-amber-300">~70% Retido</span>
          <span class="font-interface text-[11px] text-textSecondary">A curva é resetada e a taxa de perda desacelera.</span>
        </div>

        <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-1">
          <span class="font-technical text-[10px] uppercase text-emerald-400 font-semibold">3ª Revisão (7d)</span>
          <span class="font-editorial text-2xl text-emerald-300">> 90% Estável</span>
          <span class="font-interface text-[11px] text-textSecondary">Fixação duradoura na memória de longo prazo.</span>
        </div>
      </div>
    </section>

    <!-- ARTIGO EXPLICATIVO / FUNDAMENTAÇÃO TEÓRICA -->
    <article class="flex flex-col gap-12 font-interface text-textPrimary text-base sm:text-lg leading-relaxed">
      <!-- Tópico 1 -->
      <section class="flex flex-col gap-4">
        <h3 class="font-editorial text-3xl font-light text-textPrimary">
          1. Quem foi Hermann Ebbinghaus e o que ele descobriu?
        </h3>
        <p class="text-textSecondary leading-relaxed">
          Em 1885, o psicólogo alemão <strong>Hermann Ebbinghaus</strong> publicou o estudo seminal <em>"Über das Gedächtnis"</em> (Sobre a Memória), tornando-se o pioneiro no estudo quantitativo e experimental do aprendizado humano. Ele memorizou listas de sílabas sem sentido e mediu a velocidade com que esquecia essas informações ao longo do tempo.
        </p>
        <p class="text-textSecondary leading-relaxed">
          A descoberta foi estarrecedora: o esquecimento não é linear, mas segue uma curva logarítmica íngreme. Nas primeiras horas após a leitura, a perda é máxima. Após um único dia sem contato com o material, a maior parte do conteúdo lido simplesmente desaparece.
        </p>
      </section>

      <div class="h-px bg-divider/60 w-full"></div>

      <!-- Tópico 2: A Fórmula Matemática -->
      <section class="flex flex-col gap-4">
        <h3 class="font-editorial text-3xl font-light text-textPrimary">
          2. A Fórmula Matemática da Memória
        </h3>
        <p class="text-textSecondary leading-relaxed">
          Ebbinghaus modelou a retenção através da seguinte equação de decaimento exponencial:
        </p>

        <!-- Fórmula em Destaque Visual -->
        <div class="p-6 rounded-2xl bg-white/[0.03] border border-accent/30 flex flex-col items-center justify-center gap-2 text-center my-2">
          <span class="font-editorial text-3xl sm:text-4xl text-accent font-normal tracking-wider">
            R = e<sup>-t / S</sup>
          </span>
          <span class="font-interface text-xs text-textSecondary max-w-md">
            Onde <strong>R</strong> é a retenção, <strong>t</strong> é o tempo decorrido e <strong>S</strong> é a estabilidade/força da memória.
          </span>
        </div>

        <p class="text-textSecondary leading-relaxed">
          Sem intervenção, a estabilidade <em>S</em> é extremamente baixa. No entanto, cada vez que você é forçado a recuperar ativamente a resposta a uma pergunta (Active Recall), o valor de <em>S</em> se multiplica, fazendo com que o tempo necessário para esquecer passe de dias para semanas, meses e anos.
        </p>
      </section>

      <div class="h-px bg-divider/60 w-full"></div>

      <!-- Tópico 3: Como o Aresta resolve isso -->
      <section class="flex flex-col gap-4">
        <h3 class="font-editorial text-3xl font-light text-textPrimary">
          3. A Solução do Aresta: Leituras Conectadas a Flashcards
        </h3>
        <p class="text-textSecondary leading-relaxed">
          Ler um livro inteiro sem revisitar seus pontos fundamentais é como encher um balde furado. O <strong>Aresta</strong> foi desenhado desde o primeiro dia para resolver este gargalo cognitivo:
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col gap-2">
            <div class="flex items-center gap-2 font-technical text-xs text-accent">
              <CheckCircle2Icon class="w-4 h-4" />
              Geração a Partir de Anotações
            </div>
            <h4 class="font-editorial text-xl text-textPrimary">Crie Cards com 1 Clique</h4>
            <p class="text-xs text-textSecondary leading-relaxed">
              Transforme citações e insights capturados durante a leitura diretamente em cartões de pergunta e resposta.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-white/[0.02] border border-divider flex flex-col gap-2">
            <div class="flex items-center gap-2 font-technical text-xs text-accent">
              <CheckCircle2Icon class="w-4 h-4" />
              Intervalos Otimizados
            </div>
            <h4 class="font-editorial text-xl text-textPrimary">Central de Revisão Diária</h4>
            <p class="text-xs text-textSecondary leading-relaxed">
              O algoritmo seleciona automaticamente os cartões que estão na zona crítica de esquecimento para você revisar em poucos minutos por dia.
            </p>
          </div>
        </div>

        <!-- CTA Final para Central de Revisão -->
        <div class="mt-8 p-8 rounded-3xl bg-gradient-to-r from-accent/20 via-white/5 to-white/[0.02] border border-accent/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div class="flex flex-col gap-1 max-w-xl">
            <span class="font-technical text-[10px] uppercase font-semibold tracking-wider text-accent">Comece Agora</span>
            <h4 class="font-editorial text-2xl text-textPrimary">Pratique seus Flashcards de Hoje</h4>
            <p class="font-interface text-xs text-textSecondary">
              Consolide os conceitos do seu livro atual antes que a curva atue.
            </p>
          </div>

          <NuxtLink
            to="/revisao"
            class="px-6 py-3 rounded-2xl bg-accent hover:bg-accent/90 text-white font-interface text-xs sm:text-sm font-medium transition-all shadow-lg shadow-accent/20 flex items-center gap-2 shrink-0"
          >
            Ir para Central de Revisão
          </NuxtLink>
        </div>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  BrainIcon,
  CheckCircle2Icon
} from 'lucide-vue-next'
import EbbinghausChart from '~/components/EbbinghausChart.vue'
</script>
