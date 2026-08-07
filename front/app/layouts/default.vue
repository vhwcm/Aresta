<template>
  <div class="flex h-screen w-full overflow-hidden bg-bgApp relative text-textPrimary">

    <!-- Nav Rail (A Navegação Minimalista) -->
    <nav class="w-16 bg-bgPanel border-r border-divider flex flex-col items-center py-8 gap-8 shrink-0 z-10">
      <NuxtLink to="/" class="p-3 rounded-xl transition-all duration-300" :class="route.path === '/' ? 'bg-white text-black shadow-lg hover:scale-105' : 'text-textSecondary opacity-40 hover:opacity-100 hover:text-white'" title="Início">
        <HomeIcon class="w-5 h-5" />
      </NuxtLink>

      <NuxtLink to="/library" class="p-3 rounded-xl transition-all duration-300" :class="route.path.startsWith('/library') ? 'bg-white text-black shadow-lg hover:scale-105' : 'text-textSecondary opacity-40 hover:opacity-100 hover:text-white'" title="Biblioteca">
        <BookIcon class="w-5 h-5" />
      </NuxtLink>

      <NuxtLink to="/ai" class="p-3 rounded-xl transition-all duration-300" :class="route.path.startsWith('/ai') ? 'bg-white text-black shadow-lg hover:scale-105' : 'text-textSecondary opacity-40 hover:opacity-100 hover:text-white'" title="Assistente IA">
        <BrainIcon class="w-5 h-5" />
      </NuxtLink>

      <NuxtLink to="/grafo" class="p-3 rounded-xl transition-all duration-300" :class="route.path.startsWith('/grafo') ? 'bg-white text-black shadow-lg hover:scale-105' : 'text-textSecondary opacity-40 hover:opacity-100 hover:text-white'" title="Mapa Mental / Grafo">
        <NetworkIcon class="w-5 h-5 text-accent" />
      </NuxtLink>

      <NuxtLink to="/por-que-ler" class="p-3 rounded-xl transition-all duration-300" :class="route.path.startsWith('/por-que-ler') ? 'bg-white text-black shadow-lg hover:scale-105' : 'text-textSecondary opacity-40 hover:opacity-100 hover:text-white'" title="Por que ler ainda importa">
        <FileTextIcon class="w-5 h-5" />
      </NuxtLink>

      <!-- Link para Gestão de Usuários (Apenas para ADMIN) -->
      <NuxtLink
        v-if="auth.isAdmin.value"
        to="/users"
        class="p-3 rounded-xl transition-all duration-300"
        :class="route.path.startsWith('/users') ? 'bg-white text-black shadow-lg hover:scale-105' : 'text-textSecondary opacity-40 hover:opacity-100 hover:text-white'"
        title="Gestão de Usuários (Admin)"
      >
        <UsersIcon class="w-5 h-5 text-accent" />
      </NuxtLink>

      <!-- Área de Login / Perfil na Base do Nav Rail -->
      <div class="mt-auto flex flex-col items-center gap-4">
        <div v-if="auth.isLoggedIn.value" class="flex flex-col items-center gap-2">
          <div
            class="w-9 h-9 rounded-full bg-accent/20 border border-accent/40 text-accent font-technical text-xs flex items-center justify-center font-bold"
            :title="`Logado como ${auth.user.value?.name} (${auth.user.value?.role})`"
          >
            {{ auth.user.value?.name?.charAt(0).toUpperCase() || 'V' }}
          </div>

          <button
            @click="auth.logout()"
            class="p-2 rounded-xl transition-all duration-300 text-textSecondary opacity-40 hover:opacity-100 hover:text-rose-400"
            title="Sair da Conta"
          >
            <LogOutIcon class="w-4 h-4" />
          </button>
        </div>

        <NuxtLink
          v-else
          to="/login"
          class="p-3 rounded-xl transition-all duration-300"
          :class="route.path === '/login' ? 'bg-white text-black shadow-lg hover:scale-105' : 'text-textSecondary opacity-40 hover:opacity-100 hover:text-white'"
          title="Fazer Login"
        >
          <LogInIcon class="w-5 h-5" />
        </NuxtLink>
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

      <!-- Fundo desvanecendo para a base -->
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
import { HomeIcon, BookIcon, BrainIcon, FileTextIcon, UsersIcon, SearchIcon, NetworkIcon, LogInIcon, LogOutIcon } from 'lucide-vue-next'
import CommandPalette from '~/components/CommandPalette.vue'
import { useAuth } from '~/composables/useAuth'

const commandPaletteRef = ref()
const route = useRoute()
const auth = useAuth()

const openCommandPalette = () => {
  if (commandPaletteRef.value) {
    commandPaletteRef.value.open()
  }
}
</script>
