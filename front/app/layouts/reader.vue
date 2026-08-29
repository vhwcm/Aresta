<template>
  <div
    class="layout-reader"
    :class="['layout-reader--' + activeTheme, { 'layout-reader--reading': store.hasDocument }]"
    :data-theme="activeTheme === 'sepia' ? 'sepia' : (activeTheme === 'white' ? 'light' : 'dark')"
    :style="{ backgroundColor: themeBgColor }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useReaderStore } from '~/stores/readerStore'

const store = useReaderStore()
const activeTheme = computed(() => store.readerTheme || 'sepia')
const themeBgColor = computed(() => {
  if (activeTheme.value === 'white') return '#ffffff'
  if (activeTheme.value === 'black') return '#121214'
  return '#f5eedc'
})
</script>

<style scoped>
.layout-reader {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  z-index: 50;
  transition: background-color 0.2s ease;
}

.layout-reader--sepia {
  background-color: #f5eedc;
}

.layout-reader--white {
  background-color: #ffffff;
}

.layout-reader--black {
  background-color: #121214;
}

.layout-reader--reading {
  overflow: hidden;
}
</style>
