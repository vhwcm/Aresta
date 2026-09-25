<template>
  <div
    v-if="store.isFocusMode"
    class="reader-focus-overlay select-none"
    :class="[
      'reader-focus-overlay--theme-' + store.readerTheme,
      { 'reader-focus-overlay--inactive': isInactive },
    ]"
    :style="{ pointerEvents: 'auto' }"
    role="region"
    aria-label="Máscara do modo de foco. Clique para avançar para as próximas linhas."
    @click.stop="handleAdvance"
    @contextmenu.prevent
  >
    <!-- Se estiver inativo (página adjacente totalmente desfocada), exibe painel integral sem corte nem indicador -->
    <template v-if="isInactive">
      <div class="reader-focus-overlay__pane reader-focus-overlay__pane--full" />
    </template>

    <template v-else>
      <!-- Painel Superior com Desfoque Intenso -->
      <div
        class="reader-focus-overlay__pane reader-focus-overlay__pane--top"
        :style="{
          height: `${Math.max(0, top)}px`,
        }"
      >
        <div v-if="top > 0" class="reader-focus-overlay__feather reader-focus-overlay__feather--bottom" />
      </div>

      <!-- Faixa Central Nítida (Janela de Leitura Ativa) -->
      <div
        v-if="height > 0"
        class="reader-focus-overlay__aperture"
        :style="{
          top: `${top}px`,
          height: `${height}px`,
        }"
      >
        <!-- Indicador visual sutil da linha guia na margem esquerda -->
        <div class="reader-focus-overlay__guide-marker" />
      </div>

      <!-- Painel Inferior com Desfoque Intenso -->
      <div
        class="reader-focus-overlay__pane reader-focus-overlay__pane--bottom"
        :style="{
          top: `${bottom}px`,
        }"
      >
        <div class="reader-focus-overlay__feather reader-focus-overlay__feather--top" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useReaderStore } from '~/stores/readerStore'

const props = withDefaults(
  defineProps<{
    top?: number
    height?: number
    bottom?: number
  }>(),
  {
    top: 0,
    height: 100,
    bottom: 100,
  },
)

const emit = defineEmits<{
  (_e: 'advance'): void
}>()

const store = useReaderStore()

const isInactive = computed(() => {
  return typeof props.height === 'number' && props.height <= 0
})

const top = computed(() => Math.max(0, Math.round(props.top ?? 0)))
const height = computed(() => (isInactive.value ? 0 : Math.max(20, Math.round(props.height ?? 0))))
const bottom = computed(() => {
  if (typeof props.bottom === 'number' && props.bottom > 0) {
    return Math.round(props.bottom)
  }
  return top.value + height.value
})

function handleAdvance(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('advance')
}
</script>

<style scoped>
.reader-focus-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 28;
  cursor: pointer;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.reader-focus-overlay__pane {
  position: absolute;
  left: 0;
  right: 0;
  backdrop-filter: blur(24px) saturate(70%);
  -webkit-backdrop-filter: blur(24px) saturate(70%);
  transition: top 0.22s cubic-bezier(0.16, 1, 0.3, 1),
              height 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: top, height;
}

.reader-focus-overlay__pane--full {
  inset: 0;
  width: 100%;
  height: 100%;
}

.reader-focus-overlay__pane--top {
  top: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.reader-focus-overlay__pane--bottom {
  bottom: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

/* Temas com ajustes de opacidade e matiz reforçados para ocultar o texto de fundo */
.reader-focus-overlay--theme-sepia .reader-focus-overlay__pane {
  background-color: rgba(245, 238, 220, 0.82);
}

.reader-focus-overlay--theme-white .reader-focus-overlay__pane {
  background-color: rgba(255, 255, 255, 0.85);
}

.reader-focus-overlay--theme-black .reader-focus-overlay__pane {
  background-color: rgba(0, 0, 0, 0.92);
  border-color: rgba(255, 255, 255, 0.05);
}

/* Transições suaves de degradê nas bordas da abertura */
.reader-focus-overlay__feather {
  position: absolute;
  left: 0;
  right: 0;
  height: 14px;
  pointer-events: none;
}

.reader-focus-overlay__feather--bottom {
  bottom: 0;
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.03));
}

.reader-focus-overlay__feather--top {
  top: 0;
  background: linear-gradient(to top, transparent, rgba(0, 0, 0, 0.03));
}

/* Janela Focal Nítida */
.reader-focus-overlay__aperture {
  position: absolute;
  left: 0;
  right: 0;
  transition: top 0.22s cubic-bezier(0.16, 1, 0.3, 1),
              height 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.04);
}

/* Marcador visual na borda esquerda da faixa */
.reader-focus-overlay__guide-marker {
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  border-top-right-radius: 3px;
  border-bottom-right-radius: 3px;
  background-color: var(--color-accent, #6366f1);
  opacity: 0.75;
}
</style>
