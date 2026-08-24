<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <SettingsModal />
    <StreakCelebrationModal />
    <StreakShareModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import SettingsModal from '~/components/SettingsModal.vue'
import StreakCelebrationModal from '~/components/StreakCelebrationModal.vue'
import StreakShareModal from '~/components/StreakShareModal.vue'
import { useAuth } from '~/composables/useAuth'
import { useSettings } from '~/composables/useSettings'

const auth = useAuth()
const { loadFromServer } = useSettings()

onMounted(() => {
  if (auth.isLoggedIn.value) {
    void loadFromServer()
  }
})
</script>
