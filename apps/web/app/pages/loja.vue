<template>
  <div class="flex flex-col items-center justify-center min-h-[65vh] text-center px-4 py-16 animate-in fade-in duration-500">
    <div class="w-16 h-16 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-6 shadow-lg shadow-accent/5">
      <ShoppingBagIcon class="w-8 h-8" />
    </div>

    <div class="flex items-center gap-2 font-technical text-[11px] uppercase font-semibold tracking-widest text-accent mb-3">
      <span>Acervo Editorial</span>
    </div>

    <h1 class="font-editorial text-4xl sm:text-5xl font-light text-textPrimary leading-tight mb-4">
      Loja & Catálogo
    </h1>

    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-divider text-textSecondary font-interface text-sm mb-8">
      <ClockIcon class="w-4 h-4 text-accent" />
      <span>Em breve.</span>
    </div>

    <p class="font-interface text-textSecondary text-sm max-w-md leading-relaxed mb-8">
      Estamos preparando uma seleção refinada de obras clássicas e tratados intelectuais integrados ao ecossistema Aresta.
    </p>

    <NuxtLink
      to="/library"
      class="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-interface text-xs font-semibold transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
    >
      <BookOpenIcon class="w-4 h-4" />
      <span>Acessar Minha Estante</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { ShoppingBagIcon, ClockIcon, BookOpenIcon } from 'lucide-vue-next'
</script>
