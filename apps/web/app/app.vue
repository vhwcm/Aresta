<template>
  <div
    class="min-h-screen text-textPrimary selection:bg-accent/20 transition-all bg-bgPanel"
    :class="[
      !auth.isLoggedIn.value && !isImmersivePage ? 'px-3 sm:px-4 md:px-6 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-8' : ''
    ]"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CommandPalette />
    <SettingsModal />
    <StreakCelebrationModal />
    <StreakShareModal />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import CommandPalette from '~/components/CommandPalette.vue'
import SettingsModal from '~/components/SettingsModal.vue'
import StreakCelebrationModal from '~/components/StreakCelebrationModal.vue'
import StreakShareModal from '~/components/StreakShareModal.vue'
import { useAuth } from '~/composables/useAuth'
import { useDriveSync } from '~/composables/useDriveSync'

const route = typeof useRoute === 'function' ? useRoute() : { path: '/' }
const auth = useAuth()
const { initListeners, sync } = useDriveSync()

onMounted(() => {
  initListeners()
  if (auth.isLoggedIn.value) {
    void sync()
  }
})

watch(() => auth.isLoggedIn.value, (loggedIn) => {
  if (loggedIn) {
    void sync()
  }
})

// O leitor imersivo e o canvas de edição ocupam a viewport total
const isImmersivePage = computed(() => {
  const currentPath = route?.path || ''
  return currentPath === '/onboarding' || currentPath.startsWith('/reader') || /^\/canvas\/.+/.test(currentPath)
})

const isOnboardingPage = computed(() => (route?.path || '') === '/onboarding')

const isCanvasPage = computed(() => {
  const currentPath = route?.path || ''
  if (currentPath === '/' && auth.isLoggedIn.value) return true
  return currentPath === '/canvas' || currentPath.startsWith('/notes')
})
</script>
