<template>
  <div class="w-full my-4 rounded-xl border border-divider overflow-hidden bg-bgSurface shadow-lg transition-all flex flex-col">
    <!-- Embed Header -->
    <div class="flex items-center justify-between px-4 py-2.5 bg-bgPanel border-b border-divider select-none">
      <div class="flex items-center gap-2 min-w-0">
        <span class="w-2.5 h-2.5 rounded-full bg-primary/80 animate-pulse" />
        <span class="text-xs font-semibold text-textPrimary truncate">
          {{ canvasTitle || 'Quadro Infinito Embutido' }}
        </span>
        <span v-if="nodeCount > 0" class="text-[10px] text-textSecondary px-1.5 py-0.5 rounded bg-bgElevated border border-divider">
          {{ nodeCount }} nós
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="p-1 rounded text-textSecondary hover:text-textPrimary hover:bg-bgElevated text-xs transition-colors"
          title="Diminuir Zoom"
          @click="zoomOut"
        >
          🔍-
        </button>
        <button
          type="button"
          class="p-1 rounded text-textSecondary hover:text-textPrimary hover:bg-bgElevated text-xs transition-colors"
          title="Aumentar Zoom"
          @click="zoomIn"
        >
          🔍+
        </button>
        <button
          type="button"
          class="p-1 rounded text-textSecondary hover:text-textPrimary hover:bg-bgElevated text-xs transition-colors"
          title="Centralizar"
          @click="resetView"
        >
          🎯
        </button>

        <NuxtLink
          :to="`/canvas?id=${canvasId}`"
          class="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-medium transition-colors"
        >
          <span>Abrir Completo</span>
          <span>↗</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Embed Body / Canvas Viewport -->
    <div
      ref="containerRef"
      class="relative w-full h-80 bg-bgDarker overflow-hidden cursor-grab active:cursor-grabbing select-none"
      @mousedown="startPan"
      @mousemove="doPan"
      @mouseup="endPan"
      @mouseleave="endPan"
      @wheel.prevent="handleWheel"
    >
      <!-- Se houver ciclo detectado -->
      <div v-if="cycleResult.hasCycle || cycleResult.maxDepthReached" class="absolute inset-0 flex items-center justify-center p-6">
        <CycleWarningPlaceholder
          :max-depth-reached="cycleResult.maxDepthReached"
          :cycle-chain="cycleResult.cycleChain"
          :target-url="`/canvas?id=${canvasId}`"
        />
      </div>

      <!-- Loading State -->
      <div v-else-if="isLoading" class="absolute inset-0 flex items-center justify-center text-textSecondary text-xs">
        Carregando quadro...
      </div>

      <!-- Canvas Render Layer -->
      <div
        v-else
        class="absolute origin-top-left transition-transform duration-75 ease-out"
        :style="{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
        }"
      >
        <!-- Nodes -->
        <div
          v-for="node in nodes"
          :key="node.id"
          class="absolute rounded-lg border border-divider/80 bg-bgPanel/95 p-3 text-xs shadow-sm"
          :style="{
            left: `${node.x}px`,
            top: `${node.y}px`,
            width: `${node.width}px`,
            height: `${node.height}px`,
            borderColor: node.color || undefined
          }"
        >
          <div v-if="node.type === 'book'" class="flex items-center gap-2 h-full">
            <span class="text-lg">📚</span>
            <div class="min-w-0">
              <div class="font-semibold text-textPrimary truncate">{{ node.bookTitle || 'Livro' }}</div>
              <div class="text-[10px] text-textSecondary truncate">{{ node.bookAuthor || '' }}</div>
            </div>
          </div>
          <div v-else-if="node.type === 'note_embed'" class="h-full flex flex-col">
            <div class="font-semibold text-primary text-[11px] truncate mb-1">📝 {{ node.noteTitle || 'Nota' }}</div>
            <div class="text-[10px] text-textSecondary line-clamp-3">{{ node.noteContent || node.text || '' }}</div>
          </div>
          <div v-else class="h-full overflow-hidden text-textPrimary">
            <div class="line-clamp-4 whitespace-pre-wrap">{{ node.text || '' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, provide } from 'vue';
import type { CanvasNode, CanvasEdge, CanvasViewport, CanvasItem } from '~/interfaces/canvas';
import { useCycleDetector, type RenderContextItem } from '~/composables/useCycleDetector';
import CycleWarningPlaceholder from '~/components/canvas/CycleWarningPlaceholder.vue';
import { useAuth } from '~/composables/useAuth';

const props = defineProps<{
  canvasId: string;
}>();

const { token } = useAuth();
const parentStack = inject<RenderContextItem[]>('ancestorStack', []);
const { checkCycle, createNextStack } = useCycleDetector(parentStack);

const cycleResult = computed(() => {
  return checkCycle('canvas', props.canvasId);
});

// Fornece a nova pilha para componentes filhos se houver
const nextStack = computed(() => {
  return createNextStack({ type: 'canvas', id: props.canvasId, title: canvasTitle.value });
});
provide('ancestorStack', nextStack.value);

const containerRef = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const canvasTitle = ref('');
const nodes = ref<CanvasNode[]>([]);
const edges = ref<CanvasEdge[]>([]);
const viewport = ref<CanvasViewport>({ x: 40, y: 40, zoom: 0.85 });

const nodeCount = computed(() => nodes.value.length);

const isPanning = ref(false);
const startPanX = ref(0);
const startPanY = ref(0);

const loadCanvasData = async () => {
  if (cycleResult.value.hasCycle || cycleResult.value.maxDepthReached) return;
  isLoading.value = true;
  try {
    const headers: Record<string, string> = {};
    if (token?.value) headers.Authorization = `Bearer ${token.value}`;

    const res = await $fetch<CanvasItem>(`http://localhost:7070/api/canvases/${props.canvasId}`, {
      headers,
    });

    if (res) {
      canvasTitle.value = res.title;
      const parsed = JSON.parse(res.data);
      nodes.value = parsed.nodes || [];
      edges.value = parsed.edges || [];
      if (parsed.viewport) {
        viewport.value = {
          x: parsed.viewport.x ?? 40,
          y: parsed.viewport.y ?? 40,
          zoom: parsed.viewport.zoom ?? 0.85,
        };
      }
    }
  } catch (e) {
    console.warn('[CanvasEmbedPreview] Falha ao carregar dados do canvas:', e);
  } finally {
    isLoading.value = false;
  }
};

const startPan = (e: MouseEvent) => {
  isPanning.value = true;
  startPanX.value = e.clientX - viewport.value.x;
  startPanY.value = e.clientY - viewport.value.y;
};

const doPan = (e: MouseEvent) => {
  if (!isPanning.value) return;
  viewport.value.x = e.clientX - startPanX.value;
  viewport.value.y = e.clientY - startPanY.value;
};

const endPan = () => {
  isPanning.value = false;
};

const handleWheel = (e: WheelEvent) => {
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  viewport.value.zoom = Math.min(Math.max(viewport.value.zoom * factor, 0.2), 2.0);
};

const zoomIn = () => {
  viewport.value.zoom = Math.min(viewport.value.zoom * 1.2, 2.0);
};

const zoomOut = () => {
  viewport.value.zoom = Math.max(viewport.value.zoom * 0.8, 0.2);
};

const resetView = () => {
  viewport.value = { x: 40, y: 40, zoom: 0.85 };
};

onMounted(() => {
  loadCanvasData();
});
</script>
