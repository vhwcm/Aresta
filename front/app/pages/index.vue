<template>
  <div class="flex flex-col gap-14 pb-24 animate-in fade-in duration-500">
    <!-- Secção de Destaque / Leitura Atual -->
    <section class="flex flex-col gap-6">
      <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
        Leitura Ativa
      </div>

      <div class="flex flex-col gap-4">
        <h1 class="font-editorial text-4xl md:text-5xl font-light text-textPrimary leading-tight">
          A Estrutura das Revoluções Científicas
        </h1>
        <p class="font-interface text-base md:text-lg text-textSecondary max-w-2xl leading-relaxed">
          Thomas S. Kuhn argumenta que a ciência não progride de forma linear cumulativa, mas através de rupturas de paradigma. Uma leitura basilar para entender como o conhecimento se transforma.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-4 md:gap-6 mt-2">
        <NuxtLink
          to="/reader"
          class="bg-white text-black font-interface text-xs md:text-sm font-medium px-6 py-3 rounded-full hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg shadow-white/10"
        >
          Continuar Leitura
          <ArrowRightIcon class="w-4 h-4" />
        </NuxtLink>

        <NuxtLink
          to="/conversor"
          class="px-5 py-3 rounded-full border border-divider bg-white/5 hover:bg-white/10 text-textPrimary font-interface text-xs md:text-sm transition-colors flex items-center gap-2"
        >
          <FileCode2Icon class="w-4 h-4 text-accent" />
          Converter PDF para EPUB
        </NuxtLink>

        <div class="flex items-center gap-3 text-textSecondary font-technical text-xs ml-auto">
          <span>Pág. 124 de 352</span>
          <span>·</span>
          <span class="text-accent font-semibold">35% concluído</span>
        </div>
      </div>
    </section>

    <div class="h-px bg-divider w-full"></div>

    <!-- Secção de Conhecimento Gerado (IA & Revisão) -->
    <section class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
          <BrainIcon class="w-3.5 h-3.5 text-accent" />
          Síntese de IA & Conexões
        </div>
        <NuxtLink to="/revisao" class="font-technical text-xs text-accent hover:underline flex items-center gap-1">
          Ver todos os Flashcards & Resumos →
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        <NuxtLink
          to="/revisao"
          class="p-8 rounded-3xl bg-white/[0.02] border border-divider hover:border-accent/40 hover:bg-white/[0.05] transition-all flex flex-col gap-4 group"
        >
          <div class="flex items-center justify-between">
            <span class="font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">Flashcard do Dia</span>
            <SparklesIcon class="w-4 h-4 text-textSecondary group-hover:text-accent transition-colors" />
          </div>
          <h3 class="font-editorial text-2xl font-light text-textPrimary group-hover:text-white">
            O que é um "Paradigma" segundo Kuhn?
          </h3>
          <p class="font-interface text-textSecondary text-xs leading-relaxed">
            Um conjunto de práticas e modelos conceituais aceitos por uma comunidade científica durante um período determinado.
          </p>
          <div class="pt-2 flex items-center text-xs text-accent font-interface font-medium">
            Praticar Revisão Espaçada ↗
          </div>
        </NuxtLink>

        <NuxtLink
          to="/grafo"
          class="p-8 rounded-3xl bg-white/[0.02] border border-divider hover:border-accent/40 hover:bg-white/[0.05] transition-all flex flex-col gap-4 group"
        >
          <div class="flex items-center justify-between">
            <span class="font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">Grafo de Conhecimento</span>
            <NetworkIcon class="w-4 h-4 text-textSecondary group-hover:text-accent transition-colors" />
          </div>
          <h3 class="font-editorial text-2xl font-light text-textPrimary group-hover:text-white">
            Falsificacionismo vs Mudança de Paradigma
          </h3>
          <p class="font-interface text-textSecondary text-xs leading-relaxed">
            Conexão identificada entre a epistemologia de Karl Popper e a tese de Kuhn sobre a refutação de teorias.
          </p>
          <div class="pt-2 flex items-center text-xs text-accent font-interface font-medium">
            Explorar Grafo de Ideias ↗
          </div>
        </NuxtLink>
      </div>
    </section>

    <div class="h-px bg-divider w-full"></div>

    <!-- Obras Recentes & Catálogo -->
    <section class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
          Biblioteca Pessoal
        </div>
        <NuxtLink to="/library" class="font-technical text-xs text-textSecondary hover:text-white flex items-center gap-1">
          Ver Estante Completa →
        </NuxtLink>
      </div>

      <div class="flex flex-col gap-4">
        <NuxtLink
          to="/reader"
          class="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-divider transition-all group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-16 bg-white/5 border border-divider rounded-xl flex items-center justify-center group-hover:border-accent/50 transition-colors">
              <BookOpenIcon class="w-5 h-5 text-textSecondary group-hover:text-accent transition-colors" />
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="font-editorial text-xl font-light text-textPrimary group-hover:text-white transition-colors">
                Sapiens: Uma Breve História da Humanidade
              </span>
              <span class="font-interface text-xs text-textSecondary">Yuval Noah Harari · 68% lido</span>
            </div>
          </div>
          <span class="font-technical text-xs text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity">
            Ler agora ↗
          </span>
        </NuxtLink>

        <NuxtLink
          to="/reader"
          class="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-divider transition-all group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-16 bg-white/5 border border-divider rounded-xl flex items-center justify-center group-hover:border-accent/50 transition-colors">
              <BookOpenIcon class="w-5 h-5 text-textSecondary group-hover:text-accent transition-colors" />
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="font-editorial text-xl font-light text-textPrimary group-hover:text-white transition-colors">
                O Design do Dia a Dia
              </span>
              <span class="font-interface text-xs text-textSecondary">Don Norman · 42% lido</span>
            </div>
          </div>
          <span class="font-technical text-xs text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity">
            Ler agora ↗
          </span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowRightIcon,
  BrainIcon,
  SparklesIcon,
  NetworkIcon,
  BookOpenIcon,
  FileCode2Icon
} from 'lucide-vue-next'
</script>
