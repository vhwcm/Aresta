<template>
  <div
    class="min-h-screen bg-bgApp text-textPrimary selection:bg-accent/20 transition-all"
    :class="isImmersivePage ? '' : 'px-3 sm:px-4 md:px-6 pt-2.5 sm:pt-3.5 pb-20 md:pb-24'"
  >
    <NuxtPage />
    <BottomNavbar />
    <CommandPalette />
    <SettingsModal />
    <StreakCelebrationModal />
    <StreakShareModal />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BottomNavbar from '~/components/BottomNavbar.vue'
import CommandPalette from '~/components/CommandPalette.vue'
import SettingsModal from '~/components/SettingsModal.vue'
import StreakCelebrationModal from '~/components/StreakCelebrationModal.vue'
import StreakShareModal from '~/components/StreakShareModal.vue'

const route = typeof useRoute === 'function' ? useRoute() : { path: '/' }

// O leitor imersivo e o canvas de edição ocupam a viewport total
const isImmersivePage = computed(() => {
  const currentPath = route?.path || ''
  return currentPath.startsWith('/reader') || /^\/canvas\/.+/.test(currentPath)
})
</script>
