<template>
  <div class="w-full h-full min-h-[140px] flex flex-col items-center justify-center p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md text-amber-200 text-center select-none shadow-sm">
    <div class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-lg mb-2">
      ⚠️
    </div>
    <h5 class="text-xs font-semibold uppercase tracking-wider text-amber-300">
      {{ maxDepthReached ? 'Profundidade Máxima Atingida' : 'Referência Cíclica Prevenida' }}
    </h5>
    <p class="text-[11px] text-amber-200/80 mt-1 max-w-[260px] line-clamp-2">
      {{
        maxDepthReached
          ? 'Para otimizar o desempenho, embeds aninhados além de 3 níveis não são expandidos inline.'
          : 'Um loop de composição foi interceptado para evitar travamento da renderização.'
      }}
    </p>

    <div v-if="cycleChain && cycleChain.length > 0" class="mt-2 text-[10px] font-mono text-amber-300/70 bg-black/20 px-2 py-0.5 rounded max-w-full truncate">
      {{ cycleChain.join(' → ') }}
    </div>

    <NuxtLink
      v-if="targetUrl"
      :to="targetUrl"
      class="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs text-amber-100 font-medium transition-colors"
      @click.stop
    >
      <span>Abrir Documento</span>
      <span>↗</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  maxDepthReached?: boolean;
  cycleChain?: string[];
  targetUrl?: string;
}>();
</script>
