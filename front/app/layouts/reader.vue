<template>
  <div
    class="layout-reader"
    :class="{ 'layout-reader--reading': store.hasDocument }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useReaderStore } from '~/stores/readerStore'

const store = useReaderStore()
</script>

<style scoped>
.layout-reader {
  position: fixed;
  inset: 0;
  background: #0a0a0e;
  overflow-y: auto;
  z-index: 50;
}

.layout-reader--reading {
  overflow: hidden;
}
</style>
