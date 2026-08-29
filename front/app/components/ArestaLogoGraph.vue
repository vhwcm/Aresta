<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="relative group inline-flex items-center justify-center p-1.5 rounded-xl transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-accent/40"
    :title="title"
    :aria-label="title"
  >
    <!-- Glow de fundo sutil no hover -->
    <div
      class="absolute inset-0 rounded-xl bg-accent/15 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500 pointer-events-none"
    ></div>

    <!-- SVG do Grafo Vivo formando a letra A (Laranja Vibrante Aresta) -->
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="aresta-graph-svg transition-transform duration-300 group-hover:scale-105"
    >
      <defs>
        <!-- Gradiente linear para arestas principais (Laranja Aresta) -->
        <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF9E7A" stop-opacity="1" />
          <stop offset="100%" stop-color="#E57B55" stop-opacity="0.95" />
        </linearGradient>

        <!-- Filtro de brilho sutil para os nós -->
        <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Arestas (Linhas que formam o A) com movimento orgânico -->
      <g class="edges-layer" stroke-linecap="round">
        <!-- Aresta Topo -> Barra Esquerda -->
        <line x1="20" y1="7" x2="12" y2="23" class="edge edge-t-l" />
        <!-- Aresta Barra Esquerda -> Base Esquerda -->
        <line x1="12" y1="23" x2="7" y2="33" class="edge edge-l-b" />
        <!-- Aresta Topo -> Barra Direita -->
        <line x1="20" y1="7" x2="28" y2="23" class="edge edge-t-r" />
        <!-- Aresta Barra Direita -> Base Direita -->
        <line x1="28" y1="23" x2="33" y2="33" class="edge edge-r-b" />
        <!-- Travessão Horizontal da Letra A -->
        <line x1="12" y1="23" x2="28" y2="23" class="edge edge-bar" />
        <!-- Aresta sutil interna para dar sensação de grafo completo -->
        <line x1="20" y1="7" x2="20" y2="23" class="edge-subtle" stroke-dasharray="2 2" />
      </g>

      <!-- Nós (Vértices do Grafo Vivo com oscilação orgânica lenta - Laranja) -->
      <g class="nodes-layer" filter="url(#nodeGlow)">
        <!-- Nó 1: Topo / Vértice Superior -->
        <g class="node-wrap node-top">
          <circle cx="20" cy="7" r="3.2" class="node-outer" />
          <circle cx="20" cy="7" r="1.3" class="node-inner animate-pulse" />
        </g>

        <!-- Nó 2: Barra Esquerda -->
        <g class="node-wrap node-mid-left">
          <circle cx="12" cy="23" r="2.8" class="node-outer" />
          <circle cx="12" cy="23" r="1.1" class="node-inner" />
        </g>

        <!-- Nó 3: Barra Direita -->
        <g class="node-wrap node-mid-right">
          <circle cx="28" cy="23" r="2.8" class="node-outer" />
          <circle cx="28" cy="23" r="1.1" class="node-inner" />
        </g>

        <!-- Nó 4: Base Esquerda -->
        <g class="node-wrap node-bot-left">
          <circle cx="7" cy="33" r="2.5" class="node-outer" />
          <circle cx="7" cy="33" r="1" class="node-inner" />
        </g>

        <!-- Nó 5: Base Direita -->
        <g class="node-wrap node-bot-right">
          <circle cx="33" cy="33" r="2.5" class="node-outer" />
          <circle cx="33" cy="33" r="1" class="node-inner" />
        </g>

        <!-- Nó Central sutil na travessa -->
        <g class="node-wrap node-center">
          <circle cx="20" cy="23" r="1.8" class="node-inner" />
        </g>
      </g>
    </svg>
  </NuxtLink>

  <div
    v-else
    class="relative group inline-flex items-center justify-center p-1.5 rounded-xl transition-all duration-300 pointer-events-none"
    :title="title"
    :aria-label="title"
  >
    <!-- Glow de fundo sutil no hover -->
    <div
      class="absolute inset-0 rounded-xl bg-accent/15 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500 pointer-events-none"
    ></div>

    <!-- SVG do Grafo Vivo formando a letra A (Laranja Vibrante Aresta) -->
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="aresta-graph-svg transition-transform duration-300 group-hover:scale-105"
    >
      <defs>
        <!-- Gradiente linear para arestas principais -->
        <linearGradient id="edgeGradDiv" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF9E7A" stop-opacity="1" />
          <stop offset="100%" stop-color="#E57B55" stop-opacity="0.95" />
        </linearGradient>

        <!-- Filtro de brilho sutil para os nós -->
        <filter id="nodeGlowDiv" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Arestas (Linhas que formam o A) com movimento orgânico -->
      <g class="edges-layer" stroke-linecap="round">
        <line x1="20" y1="7" x2="12" y2="23" class="edge edge-t-l" />
        <line x1="12" y1="23" x2="7" y2="33" class="edge edge-l-b" />
        <line x1="20" y1="7" x2="28" y2="23" class="edge edge-t-r" />
        <line x1="28" y1="23" x2="33" y2="33" class="edge edge-r-b" />
        <line x1="12" y1="23" x2="28" y2="23" class="edge edge-bar" />
        <line x1="20" y1="7" x2="20" y2="23" class="edge-subtle" stroke-dasharray="2 2" />
      </g>

      <!-- Nós (Vértices do Grafo Vivo com oscilação orgânica lenta) -->
      <g class="nodes-layer" filter="url(#nodeGlowDiv)">
        <g class="node-wrap node-top">
          <circle cx="20" cy="7" r="3.2" class="node-outer" />
          <circle cx="20" cy="7" r="1.3" class="node-inner animate-pulse" />
        </g>
        <g class="node-wrap node-mid-left">
          <circle cx="12" cy="23" r="2.8" class="node-outer" />
          <circle cx="12" cy="23" r="1.1" class="node-inner" />
        </g>
        <g class="node-wrap node-mid-right">
          <circle cx="28" cy="23" r="2.8" class="node-outer" />
          <circle cx="28" cy="23" r="1.1" class="node-inner" />
        </g>
        <g class="node-wrap node-bot-left">
          <circle cx="7" cy="33" r="2.5" class="node-outer" />
          <circle cx="7" cy="33" r="1" class="node-inner" />
        </g>
        <g class="node-wrap node-bot-right">
          <circle cx="33" cy="33" r="2.5" class="node-outer" />
          <circle cx="33" cy="33" r="1" class="node-inner" />
        </g>
        <g class="node-wrap node-center">
          <circle cx="20" cy="23" r="1.8" class="node-inner" />
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
    title?: string
    to?: string | null
  }>(),
  {
    size: 36,
    title: 'Aresta - Ir para o Início',
    to: '/'
  }
)
</script>

<style scoped>
/* Vértices e Nós com núcleo laranja vibrante e aro adaptado ao tema */
.node-outer {
  fill: var(--bg-panel, #121315);
  stroke: #E57B55;
  stroke-width: 1.6;
  transition: fill 0.3s ease, stroke 0.3s ease;
}

.node-inner {
  fill: #E57B55;
  transition: fill 0.3s ease;
}

/* Arestas sempre visíveis em Laranja Aresta (#E57B55) */
.edge {
  stroke: #E57B55;
  stroke-opacity: 0.95;
  stroke-width: 1.9;
  stroke-linecap: round;
  transition: stroke 0.3s ease, stroke-width 0.3s ease, stroke-opacity 0.3s ease, filter 0.3s ease;
}

.edge-subtle {
  stroke: #E57B55;
  stroke-opacity: 0.4;
  stroke-width: 1.1;
  stroke-dasharray: 2 2;
  stroke-linecap: round;
  transition: stroke 0.3s ease, stroke-opacity 0.3s ease;
}

/* Animação orgânica de grafo vivo: nós e arestas flutuando suavemente */
.node-top {
  animation: floatTop 6s ease-in-out infinite alternate;
  transform-origin: 20px 7px;
}

.node-mid-left {
  animation: floatMidLeft 7s ease-in-out infinite alternate;
  transform-origin: 12px 23px;
}

.node-mid-right {
  animation: floatMidRight 6.5s ease-in-out infinite alternate;
  transform-origin: 28px 23px;
}

.node-bot-left {
  animation: floatBotLeft 8s ease-in-out infinite alternate;
  transform-origin: 7px 33px;
}

.node-bot-right {
  animation: floatBotRight 7.5s ease-in-out infinite alternate;
  transform-origin: 33px 33px;
}

.node-center {
  animation: floatCenter 5.5s ease-in-out infinite alternate;
  transform-origin: 20px 23px;
}

@keyframes floatTop {
  0% { transform: translate(0px, 0px); }
  50% { transform: translate(0.8px, -1px); }
  100% { transform: translate(-0.8px, 0.5px); }
}

@keyframes floatMidLeft {
  0% { transform: translate(0px, 0px); }
  50% { transform: translate(-1px, 0.8px); }
  100% { transform: translate(0.6px, -0.6px); }
}

@keyframes floatMidRight {
  0% { transform: translate(0px, 0px); }
  50% { transform: translate(1px, -0.5px); }
  100% { transform: translate(-0.7px, 0.9px); }
}

@keyframes floatBotLeft {
  0% { transform: translate(0px, 0px); }
  50% { transform: translate(-0.7px, -0.7px); }
  100% { transform: translate(0.8px, 0.4px); }
}

@keyframes floatBotRight {
  0% { transform: translate(0px, 0px); }
  50% { transform: translate(0.7px, 0.6px); }
  100% { transform: translate(-0.6px, -0.7px); }
}

@keyframes floatCenter {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

/* Transição e realce das arestas no hover */
.group:hover .edge {
  stroke: #FF9E7A;
  stroke-opacity: 1;
  stroke-width: 2.2;
  filter: drop-shadow(0 0 4px rgba(229, 123, 85, 0.75));
}

.group:hover .node-inner {
  fill: #FF9E7A;
}

.group:hover .node-outer {
  stroke: #FF9E7A;
  filter: drop-shadow(0 0 3px rgba(229, 123, 85, 0.5));
}

.group:hover .edge-subtle {
  stroke: #FF9E7A;
  stroke-opacity: 0.65;
}
</style>
