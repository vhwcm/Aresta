<template>
  <div class="flex h-screen w-full overflow-hidden bg-bgApp relative text-textPrimary">

    <!-- Nav Rail (A Navegação Minimalista) -->
    <nav class="w-16 bg-bgPanel border-r border-divider flex flex-col items-center py-6 gap-6 shrink-0 z-10">
      <!-- System Logo Header -->
      <button
        @click="settingsModal.open()"
        class="mb-2 p-1.5 rounded-xl hover:scale-110 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
        title="Painel de Configurações"
      >
        <img src="/favicon.ico" alt="Aresta Logo" class="w-7 h-7 rounded-lg" />
      </button>

      <NuxtLink to="/" class="p-3 rounded-xl transition-all duration-300" :class="route.path === '/' ? 'bg-white text-black shadow-lg hover:scale-105' : 'text-textSecondary opacity-40 hover:opacity-100 hover:text-white'" title="Início">
        <HomeIcon class="w-5 h-5" />
      </NuxtLink>

      <NuxtLink to="/library" class="p-3 rounded-xl transition-all duration-300" :class="route.path.startsWith('/library') ? 'bg-white text-black shadow-lg hover:scale-105' : 'text-textSecondary opacity-40 hover:opacity-100 hover:text-white'" title="Biblioteca">
        <BookIcon class="w-5 h-5" />
      </NuxtLink>

      <NuxtLink to="/upload" class="p-3 rounded-xl transition-all duration-300" :class="route.path.startsWith('/upload') ? 'bg-white text-black shadow-lg hover:scale-105' : 'text-textSecondary opacity-40 hover:opacity-100 hover:text-white'" title="Upload de Livro">
        <UploadIcon class="w-5 h-5" />
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
    <main class="flex-1 relative" :class="route.path.startsWith('/grafo') ? 'overflow-hidden' : 'overflow-y-auto'">
      <div v-if="!route.path.startsWith('/grafo')" class="max-w-4xl mx-auto px-12 py-24 min-h-full flex flex-col gap-24">
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
      <div v-else class="w-full h-full">
        <slot />
      </div>
    </main>

    <!-- Grafo Interativo (O Painel Vidrado na Barra Lateral Direita) -->
    <aside v-if="!route.path.startsWith('/grafo')" class="w-96 border-l border-divider relative shrink-0 hidden lg:block z-0">
      <SidebarGraph />
    </aside>

    <CommandPalette ref="commandPaletteRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HomeIcon, BookIcon, UploadIcon, BrainIcon, FileTextIcon, UsersIcon, SearchIcon, NetworkIcon, LogInIcon, LogOutIcon } from 'lucide-vue-next'
import CommandPalette from '~/components/CommandPalette.vue'
import SidebarGraph from '~/components/SidebarGraph.vue'
import { useAuth } from '~/composables/useAuth'
import { useSettingsModal } from '~/composables/useSettingsModal'

const commandPaletteRef = ref()
const route = useRoute()
const auth = useAuth()
const settingsModal = useSettingsModal()

const openCommandPalette = () => {
  if (commandPaletteRef.value) {
    commandPaletteRef.value.open()
  }
}
</script>
