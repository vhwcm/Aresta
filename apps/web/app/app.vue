<template>
  <div
    class="min-h-screen text-textPrimary selection:bg-accent/20 transition-all bg-bgPanel"
    :class="[
      isImmersivePage ? '' : (isCanvasPage ? 'lg:pl-16 md:landscape:pl-16' : 'px-3 sm:px-4 md:px-6 lg:pl-[4.5rem] md:landscape:pl-[4.5rem] pt-2.5 sm:pt-3.5 pb-20 md:pb-24 lg:pb-8 md:landscape:pb-8')
    ]"
  >
    <NuxtPage />
    <NavbarPageConnector v-if="!isOnboardingPage" />
    <BottomNavbar v-if="!isOnboardingPage" />
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
  return currentPath === '/onboarding' || currentPath.startsWith('/reader') || /^\/canvas\/.+/.test(currentPath)
})

const isOnboardingPage = computed(() => (route?.path || '') === '/onboarding')

const isCanvasPage = computed(() => {
  const currentPath = route?.path || ''
  return currentPath === '/canvas' || currentPath.startsWith('/notes')
})
</script>
