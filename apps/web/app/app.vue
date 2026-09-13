<template>
  <div
    class="min-h-screen bg-bgApp text-textPrimary selection:bg-accent/20 transition-all"
    :class="isImmersivePage ? '' : (isCanvasPage ? 'lg:pl-[4.75rem] md:landscape:pl-[4.75rem]' : 'px-3 sm:px-4 md:px-6 lg:pl-[5.25rem] md:landscape:pl-[5.25rem] pt-2.5 sm:pt-3.5 pb-20 md:pb-24 lg:pb-8 md:landscape:pb-8')"
  >
    <NuxtPage />
    <NavbarPageConnector />
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
import NavbarPageConnector from '~/components/NavbarPageConnector.vue'
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

const isCanvasPage = computed(() => {
  const currentPath = route?.path || ''
  return currentPath === '/canvas' || currentPath.startsWith('/notes')
})
</script>
