<template>
  <div class="flex flex-col gap-16 pb-32">
    <!-- Secção de Destaque / Leitura Atual -->
    <section class="flex flex-col gap-6">
      <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
        <div class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
        Leitura Ativa
      </div>
      
      <div class="flex flex-col gap-4">
        <h1 class="font-editorial text-5xl font-light text-textPrimary leading-tight">
          A Estrutura das Revoluções Científicas
        </h1>
        <p class="font-interface text-lg text-textSecondary max-w-2xl leading-relaxed">
          Thomas S. Kuhn argumenta que a ciência não progride de forma linear, mas através de mudanças bruscas de paradigma. Uma leitura essencial para entender como o conhecimento avança.
        </p>
      </div>

      <div class="flex items-center gap-6 mt-4">
        <button class="bg-white text-black font-interface font-medium px-6 py-3 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2">
          Continuar Leitura
          <ArrowRightIcon class="w-4 h-4" />
        </button>
        <div class="flex items-center gap-3 text-textSecondary font-technical text-xs">
          <span>Pág. 124 de 352</span>
          <span>·</span>
          <span>35% concluído</span>
        </div>
      </div>
    </section>

    <div class="h-px bg-divider w-full"></div>

    <!-- Secção de Conhecimento Gerado (IA) -->
    <section class="flex flex-col gap-8">
      <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
        <BrainIcon class="w-3.5 h-3.5" />
        Síntese de IA
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        <div class="p-8 rounded-2xl bg-white/5 border border-divider hover:bg-white/10 transition-colors flex flex-col gap-4 group">
          <div class="flex items-center justify-between">
            <span class="font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">Flashcard</span>
            <SparklesIcon class="w-4 h-4 text-textSecondary group-hover:text-white transition-colors" />
          </div>
          <h3 class="font-editorial text-2xl font-light text-textPrimary">O que é um "Paradigma" segundo Kuhn?</h3>
          <p class="font-interface text-textSecondary text-sm leading-relaxed">
            Um conjunto de práticas que definem uma disciplina científica durante um período específico. Fornece os problemas e as soluções modelares para uma comunidade de praticantes.
          </p>
        </div>

        <div class="p-8 rounded-2xl bg-white/5 border border-divider hover:bg-white/10 transition-colors flex flex-col gap-4 group">
          <div class="flex items-center justify-between">
            <span class="font-technical text-[10px] uppercase font-semibold tracking-widest text-accent">Conexão Semântica</span>
            <NetworkIcon class="w-4 h-4 text-textSecondary group-hover:text-white transition-colors" />
          </div>
          <h3 class="font-editorial text-2xl font-light text-textPrimary">Falsificacionismo vs Paradigmas</h3>
          <p class="font-interface text-textSecondary text-sm leading-relaxed">
            Uma nota comparando a teoria de Kuhn com a de Karl Popper sobre como as teorias científicas são descartadas.
          </p>
        </div>
      </div>
    </section>

    <div class="h-px bg-divider w-full"></div>

    <!-- Obras Recentes -->
    <section class="flex flex-col gap-8">
      <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary">
        Biblioteca Recente
      </div>
      
      <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between group cursor-pointer">
          <div class="flex items-center gap-6">
            <div class="w-12 h-16 bg-white/5 border border-divider rounded flex items-center justify-center group-hover:border-accent/50 transition-colors">
              <BookOpenIcon class="w-5 h-5 text-textSecondary group-hover:text-accent transition-colors" />
            </div>
            <div class="flex flex-col gap-1">
              <span class="font-editorial text-xl font-light text-textPrimary group-hover:text-white transition-colors">Sapiens: Uma Breve História da Humanidade</span>
              <span class="font-interface text-sm text-textSecondary">Yuval Noah Harari</span>
            </div>
          </div>
          <span class="font-technical text-xs text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity">Abrir ↗</span>
        </div>

        <div class="flex items-center justify-between group cursor-pointer">
          <div class="flex items-center gap-6">
            <div class="w-12 h-16 bg-white/5 border border-divider rounded flex items-center justify-center group-hover:border-accent/50 transition-colors">
              <BookOpenIcon class="w-5 h-5 text-textSecondary group-hover:text-accent transition-colors" />
            </div>
            <div class="flex flex-col gap-1">
              <span class="font-editorial text-xl font-light text-textPrimary group-hover:text-white transition-colors">Design of Everyday Things</span>
              <span class="font-interface text-sm text-textSecondary">Don Norman</span>
            </div>
          </div>
          <span class="font-technical text-xs text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity">Abrir ↗</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ArrowRightIcon, BrainIcon, SparklesIcon, NetworkIcon, BookOpenIcon } from 'lucide-vue-next'
</script>
