<template>
  <div class="flex flex-col min-h-screen w-full bg-bgApp relative text-textPrimary selection:bg-accent/30 selection:text-white">
    <!-- Top Header Bar (Busca Cmd+K, Ofensiva Streak, Usuário & Configurações) -->
    <header class="w-full h-16 border-b border-divider/60 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between gap-4">
      <!-- Lado Esquerdo: Identificador / Logo Compacto -->
      <div class="flex items-center gap-3">
        <ArestaLogoGraph :size="28" />
        <span class="font-editorial text-lg tracking-wide font-light hidden sm:inline text-textPrimary">ARESTA</span>
      </div>

      <!-- Centro: Input de Busca Flutuante (Cmd+K) -->
      <div
        class="flex-1 max-w-xl mx-auto flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-divider hover:border-white/20 transition-all cursor-pointer group text-textSecondary"
        @click="openCommandPalette"
        role="button"
        tabindex="0"
        aria-label="Abrir paleta de comandos"
      >
        <SearchIcon class="w-4 h-4 group-hover:text-textPrimary transition-colors" />
        <span class="text-xs md:text-sm font-interface font-normal truncate group-hover:text-textPrimary transition-colors">
          Explorar livros, conceitos ou comandos...
        </span>
        <div class="ml-auto hidden sm:flex items-center gap-1 font-technical text-[10px] uppercase font-semibold tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
          <span>Cmd</span>
          <span>K</span>
        </div>
      </div>

      <!-- Lado Direito: Ofensiva Streak, Perfil e Configurações -->
      <div class="flex items-center gap-2 md:gap-3">
        <!-- Componente de Ofensiva (Streak) no Canto Superior Direito -->
        <ReadingStreak />

        <!-- Botão de Configurações -->
        <button
          @click="settingsModal.open()"
          class="p-2 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-white/5 border border-transparent hover:border-divider transition-all focus:outline-none focus:ring-2 focus:ring-accent/40"
          title="Configurações do Sistema"
          aria-label="Configurações do Sistema"
        >
          <SettingsIcon class="w-4 h-4" />
        </button>

        <!-- Avatar / Login -->
        <div v-if="auth.isLoggedIn.value" class="flex items-center gap-2">
          <NuxtLink
            to="/conta"
            class="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 text-accent font-technical text-xs flex items-center justify-center font-bold hover:scale-105 transition-transform"
            :title="`Logado como ${auth.user.value?.name}`"
          >
            {{ auth.user.value?.name?.charAt(0).toUpperCase() || 'U' }}
          </NuxtLink>
        </div>
        <NuxtLink
          v-else
          to="/login"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white font-interface text-xs font-medium hover:bg-accent/90 transition-all shadow-sm shadow-accent/20"
        >
          <LogInIcon class="w-3.5 h-3.5" />
          <span>Entrar</span>
        </NuxtLink>
      </div>
    </header>

    <!-- Área Principal de Conteúdo -->
    <div class="flex-1 flex w-full relative">
      <main class="flex-1 min-h-[calc(100vh-4rem)] pb-28" :class="route.path.startsWith('/grafo') ? 'overflow-hidden p-0' : 'overflow-y-auto'">
        <div v-if="!route.path.startsWith('/grafo')" class="max-w-5xl mx-auto px-4 sm:px-8 md:px-12 py-10">
          <slot />
        </div>
        <div v-else class="w-full h-full">
          <slot />
        </div>
      </main>
    </div>

    <!-- Barra de Navegação Inferior Colapsável Flutuante -->
    <BottomNavbar />

    <!-- Modais Globais -->
    <CommandPalette ref="commandPaletteRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SearchIcon, SettingsIcon, LogInIcon } from 'lucide-vue-next'
import ArestaLogoGraph from '~/components/ArestaLogoGraph.vue'
import ReadingStreak from '~/components/ReadingStreak.vue'
import BottomNavbar from '~/components/BottomNavbar.vue'
import CommandPalette from '~/components/CommandPalette.vue'
import { useAuth } from '~/composables/useAuth'
import { useSettingsModal } from '~/composables/useSettingsModal'

const route = useRoute()
const auth = useAuth()
const settingsModal = useSettingsModal()
const commandPaletteRef = ref()

const openCommandPalette = () => {
  if (commandPaletteRef.value) {
    commandPaletteRef.value.open()
  }
}
</script>
