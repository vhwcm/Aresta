<template>
  <div
    class="w-full h-full flex flex-col rounded-xl overflow-hidden bg-bgPanel/95 border backdrop-blur-md transition-all shadow-md relative group select-none cursor-move"
    :class="[
      isSelected ? 'border-primary shadow-primary/20 ring-2 ring-primary/40' : 'border-divider hover:border-dividerHover'
    ]"
    :style="{ borderColor: node.color ? node.color : undefined }"
    data-testid="canvas-node-image"
    @dblclick.stop="openLightbox"
  >
    <!-- Header / Color Bar -->
    <div
      v-if="node.color"
      class="h-1.5 w-full flex-shrink-0 cursor-move"
      :style="{ backgroundColor: node.color }"
    ></div>

    <!-- Image Container -->
    <div class="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center bg-black/10 dark:bg-black/30">
      <!-- Loading Skeleton / Placeholder -->
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center bg-bgElevated/50 animate-pulse text-textSecondary"
      >
        <div class="flex flex-col items-center gap-1.5">
          <ImageIcon class="w-6 h-6 text-textSecondary/40 animate-bounce" />
          <span class="text-[11px] text-textSecondary/60">Carregando...</span>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-if="hasError"
        class="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-bgElevated/80 text-textSecondary gap-1.5"
      >
        <ImageOffIcon class="w-7 h-7 text-red-400/80 mb-0.5" />
        <span class="text-xs font-semibold text-textPrimary">Imagem indisponível</span>
        <span class="text-[10px] text-textSecondary line-clamp-2 max-w-[180px] break-all">
          {{ node.imageUrl || 'URL inválida' }}
        </span>
        <button
          type="button"
          class="mt-1 px-2.5 py-0.5 rounded-lg bg-bgSurface hover:bg-bgElevated text-[10px] text-primary border border-divider transition-colors cursor-pointer"
          @click.stop="retryLoad"
        >
          Tentar novamente
        </button>
      </div>

      <!-- Real Image -->
      <img
        v-show="!hasError"
        :src="node.imageUrl"
        :alt="node.imageAlt || 'Imagem do Canvas'"
        class="w-full h-full object-contain pointer-events-none select-none transition-transform duration-200"
        loading="lazy"
        decoding="async"
        @load="onImageLoaded"
        @error="onImageError"
      />

      <!-- Quick Fullscreen Preview Button on Hover -->
      <button
        v-if="!hasError && !isLoading && node.imageUrl"
        type="button"
        class="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-xs shadow-md hover:scale-105"
        title="Visualizar em tela cheia (Duplo clique)"
        @click.stop="openLightbox"
      >
        <Maximize2Icon class="w-3.5 h-3.5" />
      </button>

      <!-- Caption / Alt Text Overlay Bar at Bottom -->
      <div
        v-if="node.imageAlt && !hasError"
        class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-2.5 py-1.5 text-[11px] text-white/90 truncate flex items-center gap-1.5 pointer-events-none"
        :title="node.imageAlt"
      >
        <ImageIcon class="w-3 h-3 text-accent shrink-0" />
        <span class="truncate font-medium">{{ node.imageAlt }}</span>
      </div>
    </div>

    <!-- Lightbox Modal para Visualização em Tela Cheia -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isLightboxOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200"
          @click="closeLightbox"
          @keydown.esc="closeLightbox"
        >
          <!-- Controls Bar -->
          <div class="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-10">
            <button
              type="button"
              class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Fechar (Esc)"
              @click.stop="closeLightbox"
            >
              <XIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Lightbox Content -->
          <div
            class="max-w-[90vw] max-h-[85vh] flex flex-col items-center justify-center gap-3 relative"
            @click.stop
          >
            <img
              :src="node.imageUrl"
              :alt="node.imageAlt || 'Imagem ampliada'"
              class="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />
            <div
              v-if="node.imageAlt"
              class="px-4 py-1.5 rounded-full bg-black/60 border border-white/10 text-white/90 text-xs font-medium text-center backdrop-blur-xs max-w-lg truncate"
            >
              {{ node.imageAlt }}
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import {
  Image as ImageIcon,
  ImageOff as ImageOffIcon,
  Maximize2 as Maximize2Icon,
  X as XIcon,
} from 'lucide-vue-next';
import type { CanvasNode } from '~/interfaces/canvas';

const props = defineProps<{
  node: CanvasNode;
  isSelected?: boolean;
}>();

const emit = defineEmits<{
  (_e: 'update:aspectRatio', _ratio: number): void;
}>();

const isLoading = ref(true);
const hasError = ref(false);
const isLightboxOpen = ref(false);

const onImageLoaded = (e: Event) => {
  isLoading.value = false;
  hasError.value = false;
  const img = e.target as HTMLImageElement;
  if (img && img.naturalWidth && img.naturalHeight) {
    const ratio = img.naturalWidth / img.naturalHeight;
    emit('update:aspectRatio', ratio);
  }
};

const onImageError = () => {
  isLoading.value = false;
  hasError.value = true;
};

const retryLoad = () => {
  hasError.value = false;
  isLoading.value = true;
};

const openLightbox = () => {
  if (props.node.imageUrl && !hasError.value) {
    isLightboxOpen.value = true;
  }
};

const closeLightbox = () => {
  isLightboxOpen.value = false;
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isLightboxOpen.value) {
    closeLightbox();
  }
};

watch(isLightboxOpen, (open) => {
  if (open) {
    window.addEventListener('keydown', handleKeyDown);
  } else {
    window.removeEventListener('keydown', handleKeyDown);
  }
});

watch(
  () => props.node.imageUrl,
  (newUrl) => {
    if (newUrl) {
      isLoading.value = true;
      hasError.value = false;
    }
  }
);

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>
