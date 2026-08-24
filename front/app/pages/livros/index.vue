<template>
  <div>
    <!-- Redireciona /livros para /library -->
  </div>
</template>

<script setup lang="ts">
await navigateTo('/library', { replace: true })
</script>
