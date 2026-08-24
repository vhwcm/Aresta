<template>
  <div class="flex flex-col min-h-screen w-full bg-bgApp relative text-textPrimary selection:bg-accent/30 selection:text-white">
    <!-- Área Principal de Conteúdo -->
    <div class="flex-1 flex w-full relative">
      <main class="flex-1 min-h-screen" :class="[
        route.path.startsWith('/grafo') ? 'overflow-hidden p-0' : 'overflow-y-auto',
        auth.isLoggedIn.value ? 'pb-28' : 'pb-12'
      ]">
        <div v-if="!route.path.startsWith('/grafo')" class="max-w-5xl mx-auto px-4 sm:px-8 md:px-12 py-8 md:py-12">
          <slot />
        </div>
        <div v-else class="w-full h-full">
          <slot />
        </div>
      </main>
    </div>

    <!-- Barra de Navegação Inferior Colapsável Flutuante (Apenas para Usuários Autenticados) -->
    <BottomNavbar v-if="auth.isLoggedIn.value" />

    <!-- Modais Globais -->
    <CommandPalette v-if="auth.isLoggedIn.value" />
  </div>
</template>

<script setup lang="ts">
import BottomNavbar from '~/components/BottomNavbar.vue'
import CommandPalette from '~/components/CommandPalette.vue'
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const auth = useAuth()
</script>
