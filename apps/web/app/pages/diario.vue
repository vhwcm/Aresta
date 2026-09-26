<template>
  <div class="h-full w-full flex-1 flex flex-col min-h-0 overflow-hidden" data-testid="diario-page">
    <JournalView />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import JournalView from '~/components/notes/JournalView.vue'
import { useWorkspaceSidebar } from '~/composables/useWorkspaceSidebar'

definePageMeta({
  alias: ['/diário', '/di%C3%A1rio']
})

if (typeof useHead === 'function') {
  useHead({
    title: 'Diário • Aresta'
  })
}

const { viewLayout } = useWorkspaceSidebar()

onMounted(() => {
  viewLayout.value = 'journal'
})
</script>
