<template>
  <div class="min-h-screen bg-bgRoot text-textPrimary flex flex-col items-center justify-center font-interface select-none">
    <ArestaLogoGraph :size="48" to="/canvas?tab=notes" use-image />
    <p class="text-xs text-textSecondary mt-3">Carregando o grafo de conhecimento nas suas anotações...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import ArestaLogoGraph from '~/components/ArestaLogoGraph.vue'

const route = typeof useRoute === 'function' ? useRoute() : undefined

onMounted(() => {
  const query = { ...(route?.query || {}), tab: 'notes' }
  navigateTo({ path: '/canvas', query }, { replace: true })
})
</script>
