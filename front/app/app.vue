<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <SettingsModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import SettingsModal from '~/components/SettingsModal.vue'
import { useAuth } from '~/composables/useAuth'
import { useSettings } from '~/composables/useSettings'

const auth = useAuth()
const { loadFromServer } = useSettings()

useHead({
  title: 'Aresta',
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'shortcut icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
  ],
})

onMounted(() => {
  if (auth.isLoggedIn.value) {
    void loadFromServer()
  }
})
</script>
