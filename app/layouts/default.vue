<template>
  <div class="flex h-screen w-full overflow-hidden bg-bgApp relative text-textPrimary">
    
    <!-- Nav Rail (A Navegação Minimalista) -->
    <nav class="w-16 bg-bgPanel border-r border-divider flex flex-col items-center py-8 gap-12 shrink-0 z-10">
      <NuxtLink to="/" class="p-3 rounded-xl transition-all duration-300" :class="route.path === '/' ? 'bg-white text-black shadow-lg hover:scale-105' : 'text-textSecondary opacity-40 hover:opacity-100 hover:text-white'">
        <HomeIcon class="w-5 h-5" />
      </NuxtLink>
      <NuxtLink to="/library" class="p-3 rounded-xl transition-all duration-300" :class="route.path.startsWith('/library') ? 'bg-white text-black shadow-lg hover:scale-105' : 'text-textSecondary opacity-40 hover:opacity-100 hover:text-white'">
        <BookIcon class="w-5 h-5" />
      </NuxtLink>
      <NuxtLink to="/ai" class="p-3 rounded-xl transition-all duration-300" :class="route.path.startsWith('/ai') ? 'bg-white text-black shadow-lg hover:scale-105' : 'text-textSecondary opacity-40 hover:opacity-100 hover:text-white'">
        <BrainIcon class="w-5 h-5" />
      </NuxtLink>
      <div class="mt-auto">
        <button class="p-3 rounded-xl transition-all duration-300 text-textSecondary opacity-40 hover:opacity-100 hover:text-white">
          <SettingsIcon class="w-5 h-5" />
        </button>
      </div>
    </nav>

    <!-- Stream Central (O Feed) -->
    <main class="flex-1 overflow-y-auto relative">
      <div class="max-w-4xl mx-auto px-12 py-24 min-h-full flex flex-col gap-24">
        <!-- Input Placeholder Superior -->
        <header class="flex items-center gap-4 text-textSecondary opacity-50 hover:opacity-100 transition-opacity cursor-pointer group" @click="openCommandPalette">
          <SearchIcon class="w-5 h-5 group-hover:text-white transition-colors" />
          <span class="text-lg font-interface font-light group-hover:text-white transition-colors">O que você quer explorar hoje?</span>
          <div class="ml-auto flex items-center gap-1 font-technical text-[10px] uppercase font-semibold tracking-widest bg-white/5 px-2 py-1 rounded">
            <span>Cmd</span>
            <span>K</span>
          </div>
        </header>

        <!-- Slot de Conteúdo Específico da Página -->
        <slot />
      </div>
    </main>

    <!-- Grafo Interativo (O Painel Vidrado) -->
    <aside class="w-96 border-l border-divider relative shrink-0 hidden lg:block z-0">
      <!-- Grid Background -->
      <div class="absolute inset-0 bg-grid-pattern bg-grid-size opacity-20"></div>
      
      <!-- Fundo desvanecendo para a base (Fade out to bottom) -->
      <div class="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-bgApp to-transparent z-10 pointer-events-none"></div>
      
      <!-- Placeholder de Conteúdo do Grafo -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div class="w-32 h-32 rounded-full border border-accent/20 flex items-center justify-center relative shadow-[0_0_50px_rgba(229,123,85,0.05)]">
          <div class="absolute w-full h-full animate-[spin_10s_linear_infinite] border border-dashed border-accent/30 rounded-full"></div>
          <div class="w-16 h-16 rounded-full bg-bgPanel border border-divider flex items-center justify-center">
            <NetworkIcon class="w-6 h-6 text-accent opacity-50" />
          </div>
        </div>
      </div>
      
      <!-- Legenda inferior do Grafo -->
      <div class="absolute bottom-8 left-8 right-8 z-20 pointer-events-auto">
        <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary mb-2">Knowledge Graph</div>
        <div class="text-sm font-interface font-light text-textPrimary leading-relaxed">
          Mapeamento semântico ativo. 3,402 nós conectados em tempo real através da leitura atual.
        </div>
      </div>
    </aside>

    <CommandPalette ref="commandPaletteRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HomeIcon, BookIcon, BrainIcon, SettingsIcon, SearchIcon, NetworkIcon } from 'lucide-vue-next'
import CommandPalette from '~/components/CommandPalette.vue'

const commandPaletteRef = ref()
const route = useRoute()

const openCommandPalette = () => {
  if (commandPaletteRef.value) {
    commandPaletteRef.value.open()
  }
}
</script>
