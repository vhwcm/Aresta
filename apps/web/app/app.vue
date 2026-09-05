<template>
  <div class="min-h-screen bg-bgApp text-textPrimary selection:bg-accent/20">
    <NuxtPage />
    <BottomNavbar />
    <CommandPalette />
    <SettingsModal />
    <StreakCelebrationModal />
    <StreakShareModal />
  </div>
</template>

<script setup lang="ts">
import BottomNavbar from '~/components/BottomNavbar.vue'
import CommandPalette from '~/components/CommandPalette.vue'
import SettingsModal from '~/components/SettingsModal.vue'
import StreakCelebrationModal from '~/components/StreakCelebrationModal.vue'
import StreakShareModal from '~/components/StreakShareModal.vue'
</script>
