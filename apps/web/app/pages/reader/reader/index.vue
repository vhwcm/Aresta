<template>
  <NuxtLayout name="reader">
    <ClientOnly>
      <ReaderShell />
      <template #fallback>
        <div class="reader-loading">
          <div class="reader-loading__spinner" />
          <p>Carregando leitor...</p>
        </div>
      </template>
    </ClientOnly>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})
</script>

<style scoped>
.reader-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100dvh;
  gap: 1rem;
  color: var(--color-text-secondary);
}

.reader-loading__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
