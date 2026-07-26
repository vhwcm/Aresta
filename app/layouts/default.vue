<template>
  <div class="layout-default">
    <slot />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --color-bg: #0f0f13;
  --color-surface: #1a1a24;
  --color-border: #2a2a3a;
  --color-accent: #7c6af7;
  --color-accent-hover: #9b8df9;
  --color-text-primary: #e8e8f0;
  --color-text-secondary: #8888a0;
  --color-error: #f76a6a;
  --color-success: #6af7a0;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --shadow-card: 0 4px 32px rgba(0, 0, 0, 0.4);
}

html, body {
  font-family: var(--font-sans);
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  min-height: 100dvh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
