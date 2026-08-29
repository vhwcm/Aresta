<template>
  <div class="flex flex-col min-h-screen w-full bg-bgApp relative text-textPrimary selection:bg-accent/25 selection:text-inherit">
    <!-- Área Principal de Conteúdo -->
    <div class="flex-1 flex w-full relative">
      <main class="flex-1 min-h-screen" :class="[
        route.path.startsWith('/grafo') || route.path.startsWith('/canvas/') ? 'overflow-hidden p-0' : 'overflow-y-auto',
        auth.isLoggedIn.value ? (route.path.startsWith('/canvas/') ? 'pb-0' : 'pb-28') : 'pb-12'
      ]">
        <div v-if="!route.path.startsWith('/grafo') && !route.path.startsWith('/canvas/')" class="w-full px-4 sm:px-8 md:px-10 lg:px-12 xl:px-14 2xl:px-16 py-6 md:py-8 transition-all duration-300">
          <slot />
        </div>
        <div v-else class="w-full h-full">
          <slot />
        </div>
      </main>
    </div>

    <!-- Barra de Navegação Inferior Colapsável Flutuante (Apenas para Usuários Autenticados e fora do leitor e do canvas ativo) -->
    <BottomNavbar v-if="auth.isLoggedIn.value && !route.path.startsWith('/reader') && !route.path.startsWith('/canvas/')" />

    <!-- Modais Globais -->
    <CommandPalette v-if="auth.isLoggedIn.value" />
  </div>
</template>

<script setup lang="ts">
import { watch, nextTick } from 'vue'
import BottomNavbar from '~/components/BottomNavbar.vue'
import CommandPalette from '~/components/CommandPalette.vue'
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const auth = useAuth()

watch(
  () => route.fullPath,
  async () => {
    if (typeof window !== 'undefined') {
      await nextTick()
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      const mainElem = document.querySelector('main')
      if (mainElem) {
        mainElem.scrollTop = 0
      }
    }
  }
)
</script>
