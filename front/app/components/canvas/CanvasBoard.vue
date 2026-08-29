<template>
  <div
    ref="boardContainerRef"
    class="canvas-board-wrapper relative w-full h-full overflow-hidden bg-bgRoot select-none touch-none"
    tabindex="0"
    @wheel.prevent="onWheel"
    @pointerdown="onBackgroundPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @dblclick="onDoubleClick"
    @keydown="onKeyDown"
  >
    <!-- Dot Grid Background (Infinite Pattern scaled with Zoom) -->
    <div
      class="canvas-dot-grid absolute inset-0 pointer-events-none opacity-40 dark:opacity-30 text-textSecondary"
      :style="gridStyle"
    ></div>

    <!-- Infinite Viewport (CSS Transform Matrix) -->
    <div
      class="canvas-viewport absolute inset-0 origin-top-left will-change-transform"
      :style="{
        transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
      }"
    >
      <!-- SVG Edge / Connections Layer -->
      <CanvasEdgeLayer
        :nodes="nodes"
        :edges="edges"
        :selected-edge-id="selectedEdgeId"
        :connecting-state="connectingState"
        @select-edge="onSelectEdge"
      />

      <!-- DOM Nodes / Cards Layer -->
      <CanvasNode
        v-for="node in nodes"
        :key="node.id"
        :node="node"
        :is-selected="selectedNodeIds.includes(node.id)"
        :zoom="viewport.zoom"
        @select="onSelectNode"
        @drag-start="onNodeDragStart"
        @resize-start="onNodeResizeStart"
        @start-connect="onStartConnect"
        @update-text="onUpdateNodeText"
        @update-color="onUpdateNodeColor"
        @delete="removeNode"
      />
    </div>

    <!-- Empty State Guide Overlay (Only when no nodes exist and not drawing) -->
    <div
      v-if="nodes.length === 0 && activeTool !== 'pen'"
      class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-in fade-in duration-300"
    >
      <div class="p-6 rounded-2xl bg-bgPanel/85 border border-divider/80 backdrop-blur-md shadow-2xl text-center max-w-sm pointer-events-auto select-none">
        <div class="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 text-xl font-bold">
          ✨
        </div>
        <h3 class="text-sm md:text-base font-semibold text-textPrimary font-interface">Quadro em branco</h3>
        <p class="text-xs text-textSecondary mt-1.5 mb-5 leading-relaxed">
          Dê <strong>dois cliques</strong> em qualquer lugar para criar uma nota, ou use as ações rápidas abaixo:
        </p>
        <div class="flex items-center justify-center gap-2">
          <button
            class="px-3.5 py-2 rounded-xl bg-primary hover:bg-primaryHover text-white text-xs font-semibold transition-all shadow-md hover:scale-102 cursor-pointer"
            @click="createInitialNote"
          >
            + Adicionar Nota
          </button>
          <button
            class="px-3.5 py-2 rounded-xl bg-bgElevated hover:bg-bgSurface text-textPrimary border border-divider text-xs font-medium transition-all hover:scale-102 cursor-pointer"
            @click="showInsertDrawer = true"
          >
            📖 Inserir Livro
          </button>
        </div>
      </div>
    </div>

    <!-- Inking Overlay for Handwriting & AI OCR -->
    <CanvasInkingOverlay
      :active-tool="activeTool"
      :viewport="viewport"
      @transcribed="onInkingTranscribed"
    />

    <!-- Floating Canvas Toolbar -->
    <CanvasToolbar
      :active-tool="activeTool"
      :selected-shape-type="selectedShapeType"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :zoom="viewport.zoom"
      :is-saving="isSaving"
      @update:active-tool="activeTool = $event"
      @update:selected-shape-type="selectedShapeType = $event"
      @open-insert-drawer="showInsertDrawer = true"
      @undo="undo"
      @redo="redo"
      @zoom-in="zoomAt(centerScreen.x, centerScreen.y, 1.2)"
      @zoom-out="zoomAt(centerScreen.x, centerScreen.y, 0.8)"
      @reset-zoom="resetViewport"
      @export="exportAsJsonCanvas"
    />

    <!-- Insert Books & Quotes Drawer -->
    <CanvasInsertDrawer
      v-if="showInsertDrawer"
      @close="showInsertDrawer = false"
      @insert-book="handleInsertBook"
      @insert-annotation="handleInsertAnnotation"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type {
  CanvasNode,
  CanvasEdge,
  CanvasSide,
  CanvasShapeType,
} from '~/interfaces/canvas';
import { useCanvas } from '~/composables/useCanvas';
import { getClosestAnchorSide } from '~/utils/canvasGeometry';
import CanvasNode from './CanvasNode.vue';
import CanvasEdgeLayer from './CanvasEdgeLayer.vue';
import CanvasInkingOverlay from './CanvasInkingOverlay.vue';
import CanvasToolbar from './CanvasToolbar.vue';
import CanvasInsertDrawer from './CanvasInsertDrawer.vue';

const props = defineProps<{
  canvasId?: string;
}>();

const boardContainerRef = ref<HTMLElement | null>(null);
const showInsertDrawer = ref(false);

const {
  nodes,
  edges,
  viewport,
  selectedNodeIds,
  selectedEdgeId,
  activeTool,
  selectedShapeType,
  connectingState,
  isSaving,
  canUndo,
  canRedo,
  addNode,
  updateNode,
  removeNode,
  removeSelected,
  addEdge,
  undo,
  redo,
  panBy,
  zoomAt,
  resetViewport,
  loadCanvas,
  exportAsJsonCanvas,
} = useCanvas();

// Dragging / Pan / Resize States
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });

const draggingNodeState = ref<{
  nodeId: string;
  startX: number;
  startY: number;
  initialNodeX: number;
  initialNodeY: number;
} | null>(null);

const resizingNodeState = ref<{
  nodeId: string;
  handle: string;
  startX: number;
  startY: number;
  initialWidth: number;
  initialHeight: number;
  initialX: number;
  initialY: number;
} | null>(null);

const isSpacePressed = ref(false);

const centerScreen = computed(() => {
  if (typeof window === 'undefined') return { x: 400, y: 300 };
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
});

const gridStyle = computed(() => {
  const size = 24 * viewport.value.zoom;
  const offsetX = viewport.value.x % size;
  const offsetY = viewport.value.y % size;
  return {
    backgroundImage: `radial-gradient(circle, currentColor 1.25px, transparent 1.25px)`,
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: `${offsetX}px ${offsetY}px`,
  };
});

// Canvas Coordinate Helpers
const screenToCanvas = (screenX: number, screenY: number) => {
  if (!boardContainerRef.value) return { x: 0, y: 0 };
  const rect = boardContainerRef.value.getBoundingClientRect();
  const relX = screenX - rect.left;
  const relY = screenY - rect.top;
  return {
    x: (relX - viewport.value.x) / viewport.value.zoom,
    y: (relY - viewport.value.y) / viewport.value.zoom,
  };
};

// Create Initial Note
const createInitialNote = () => {
  const centerCoords = screenToCanvas(centerScreen.value.x, centerScreen.value.y);
  const newNode: CanvasNode = {
    id: `node-${Date.now()}`,
    type: 'text',
    x: Math.round(centerCoords.x - 130),
    y: Math.round(centerCoords.y - 80),
    width: 260,
    height: 160,
    text: '',
    color: '#E57B55',
  };
  addNode(newNode);
};

// Double Click / Tap to Create Note
const onDoubleClick = (e: MouseEvent) => {
  const coords = screenToCanvas(e.clientX, e.clientY);
  const newNode: CanvasNode = {
    id: `node-${Date.now()}`,
    type: 'text',
    x: Math.round(coords.x - 120),
    y: Math.round(coords.y - 70),
    width: 260,
    height: 160,
    text: '',
    color: '#E57B55',
  };
  addNode(newNode);
};

// Background Pointer Down
const onBackgroundPointerDown = (e: PointerEvent) => {
  if (activeTool.value === 'pen') return;

  const isMiddleClick = e.button === 1;
  const isLeftClick = e.button === 0;

  // Single click with creation tool
  if (isLeftClick && (activeTool.value === 'note' || activeTool.value === 'shape' || activeTool.value === 'loose_text')) {
    const coords = screenToCanvas(e.clientX, e.clientY);
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type: activeTool.value === 'shape' ? 'shape' : (activeTool.value === 'loose_text' ? 'loose_text' : 'text'),
      shape: activeTool.value === 'shape' ? selectedShapeType.value : undefined,
      x: Math.round(coords.x - 100),
      y: Math.round(coords.y - 60),
      width: activeTool.value === 'shape' ? 180 : 240,
      height: activeTool.value === 'shape' ? 120 : 150,
      text: '',
      color: '#E57B55',
    };
    addNode(newNode);
    activeTool.value = 'select';
    return;
  }

  // Deselect on empty background click
  if (isLeftClick && !isSpacePressed.value) {
    selectedNodeIds.value = [];
    selectedEdgeId.value = null;
  }

  // Pan start (middle click, space + left click, or background drag)
  if (isMiddleClick || isSpacePressed.value || (isLeftClick && activeTool.value === 'select')) {
    isPanning.value = true;
    panStart.value = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
  }
};

const onPointerMove = (e: PointerEvent) => {
  // Panning Viewport
  if (isPanning.value) {
    const dx = e.clientX - panStart.value.x;
    const dy = e.clientY - panStart.value.y;
    panBy(dx, dy);
    panStart.value = { x: e.clientX, y: e.clientY };
    return;
  }

  // Dragging Node
  if (draggingNodeState.value) {
    const dx = (e.clientX - draggingNodeState.value.startX) / viewport.value.zoom;
    const dy = (e.clientY - draggingNodeState.value.startY) / viewport.value.zoom;
    updateNode(draggingNodeState.value.nodeId, {
      x: Math.round(draggingNodeState.value.initialNodeX + dx),
      y: Math.round(draggingNodeState.value.initialNodeY + dy),
    });
    return;
  }

  // Resizing Node
  if (resizingNodeState.value) {
    const { nodeId, handle, startX, startY, initialWidth, initialHeight, initialX, initialY } = resizingNodeState.value;
    const dx = (e.clientX - startX) / viewport.value.zoom;
    const dy = (e.clientY - startY) / viewport.value.zoom;

    let newWidth = initialWidth;
    let newHeight = initialHeight;
    let newX = initialX;
    let newY = initialY;

    if (handle.includes('e')) newWidth = Math.max(initialWidth + dx, 100);
    if (handle.includes('s')) newHeight = Math.max(initialHeight + dy, 60);
    if (handle.includes('w')) {
      const w = Math.max(initialWidth - dx, 100);
      newX = initialX + (initialWidth - w);
      newWidth = w;
    }
    if (handle.includes('n')) {
      const h = Math.max(initialHeight - dy, 60);
      newY = initialY + (initialHeight - h);
      newHeight = h;
    }

    updateNode(nodeId, { x: Math.round(newX), y: Math.round(newY), width: Math.round(newWidth), height: Math.round(newHeight) });
    return;
  }

  // Connecting Edge (Dragging Anchor)
  if (connectingState.value) {
    const coords = screenToCanvas(e.clientX, e.clientY);
    connectingState.value.currentX = coords.x;
    connectingState.value.currentY = coords.y;
  }
};

const onPointerUp = (e: PointerEvent) => {
  if (isPanning.value) {
    isPanning.value = false;
  }

  if (draggingNodeState.value) {
    draggingNodeState.value = null;
  }

  if (resizingNodeState.value) {
    resizingNodeState.value = null;
  }

  // Finalize Edge Connection
  if (connectingState.value) {
    const coords = screenToCanvas(e.clientX, e.clientY);
    // Verificar se soltou sobre outro nó
    const targetNode = nodes.value.find(
      (n) =>
        n.id !== connectingState.value!.fromNodeId &&
        coords.x >= n.x &&
        coords.x <= n.x + n.width &&
        coords.y >= n.y &&
        coords.y <= n.y + n.height
    );

    if (targetNode) {
      const targetSide = getClosestAnchorSide(coords.x, coords.y, targetNode);
      const newEdge: CanvasEdge = {
        id: `edge-${Date.now()}`,
        fromNode: connectingState.value.fromNodeId,
        fromSide: connectingState.value.fromSide,
        toNode: targetNode.id,
        toSide: targetSide,
        toEnd: 'arrow',
      };
      addEdge(newEdge);
    }

    connectingState.value = null;
  }
};

// Wheel Zoom
const onWheel = (e: WheelEvent) => {
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  zoomAt(e.clientX, e.clientY, zoomFactor);
};

// Node Interactions
const onSelectNode = (id: string, isShift: boolean) => {
  selectedEdgeId.value = null;
  if (isShift) {
    if (selectedNodeIds.value.includes(id)) {
      selectedNodeIds.value = selectedNodeIds.value.filter((i) => i !== id);
    } else {
      selectedNodeIds.value.push(id);
    }
  } else {
    selectedNodeIds.value = [id];
  }
};

const onNodeDragStart = (id: string, e: PointerEvent) => {
  if (activeTool.value === 'pen') return;
  const node = nodes.value.find((n) => n.id === id);
  if (!node) return;

  draggingNodeState.value = {
    nodeId: id,
    startX: e.clientX,
    startY: e.clientY,
    initialNodeX: node.x,
    initialNodeY: node.y,
  };
};

const onNodeResizeStart = (id: string, handle: string, e: PointerEvent) => {
  const node = nodes.value.find((n) => n.id === id);
  if (!node) return;

  resizingNodeState.value = {
    nodeId: id,
    handle,
    startX: e.clientX,
    startY: e.clientY,
    initialWidth: node.width,
    initialHeight: node.height,
    initialX: node.x,
    initialY: node.y,
  };
};

const onStartConnect = (nodeId: string, side: CanvasSide, e: PointerEvent) => {
  const coords = screenToCanvas(e.clientX, e.clientY);
  connectingState.value = {
    fromNodeId: nodeId,
    fromSide: side,
    currentX: coords.x,
    currentY: coords.y,
  };
};

const onSelectEdge = (id: string) => {
  selectedEdgeId.value = id;
  selectedNodeIds.value = [];
};

const onUpdateNodeText = (id: string, text: string) => {
  updateNode(id, { text }, true);
};

const onUpdateNodeColor = (id: string, color: string) => {
  updateNode(id, { color }, true);
};

// Inking OCR Result Handler
const onInkingTranscribed = (res: { text: string; x: number; y: number; width: number; height: number }) => {
  const newNode: CanvasNode = {
    id: `node-${Date.now()}`,
    type: 'text',
    x: Math.round(res.x),
    y: Math.round(res.y),
    width: Math.round(res.width),
    height: Math.round(res.height),
    text: res.text,
    color: '#E57B55',
  };
  addNode(newNode);
  activeTool.value = 'select';
};

// Insert Book Handler
const handleInsertBook = (book: any) => {
  const centerCoords = screenToCanvas(centerScreen.value.x, centerScreen.value.y);
  const newNode: CanvasNode = {
    id: `node-${Date.now()}`,
    type: 'book',
    x: Math.round(centerCoords.x - 130),
    y: Math.round(centerCoords.y - 70),
    width: 280,
    height: 140,
    bookId: book.bookId,
    bookTitle: book.title,
    bookAuthor: book.author || '',
    bookCover: book.coverPath,
    color: '#3B82F6',
  };
  addNode(newNode);
  showInsertDrawer.value = false;
};

// Insert Highlight Handler
const handleInsertAnnotation = (annotation: any) => {
  const centerCoords = screenToCanvas(centerScreen.value.x, centerScreen.value.y);
  const newNode: CanvasNode = {
    id: `node-${Date.now()}`,
    type: 'text',
    x: Math.round(centerCoords.x - 130),
    y: Math.round(centerCoords.y - 70),
    width: 280,
    height: 160,
    text: `> "${annotation.selectedText || ''}"\n\n${annotation.note || ''}`,
    color: '#10B981',
  };
  addNode(newNode);
  showInsertDrawer.value = false;
};

// Keydown Shortcuts
const onKeyDown = (e: KeyboardEvent) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

  if (e.key === 'Delete' || e.key === 'Backspace') {
    removeSelected();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    if (e.shiftKey) {
      redo();
    } else {
      undo();
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    redo();
  } else if (e.key === ' ' || e.code === 'Space') {
    isSpacePressed.value = true;
  } else if (e.key === 'Escape') {
    selectedNodeIds.value = [];
    selectedEdgeId.value = null;
    showInsertDrawer.value = false;
    activeTool.value = 'select';
  } else if (e.key.toLowerCase() === 'v') {
    activeTool.value = 'select';
  } else if (e.key.toLowerCase() === 'n') {
    activeTool.value = 'note';
  } else if (e.key.toLowerCase() === 's') {
    activeTool.value = 'shape';
  } else if (e.key.toLowerCase() === 'p') {
    activeTool.value = 'pen';
  }
};

const onKeyUp = (e: KeyboardEvent) => {
  if (e.key === ' ' || e.code === 'Space') {
    isSpacePressed.value = false;
  }
};

onMounted(async () => {
  window.addEventListener('keyup', onKeyUp);
  if (props.canvasId) {
    await loadCanvas(props.canvasId);
  }
});

onUnmounted(() => {
  window.removeEventListener('keyup', onKeyUp);
});
</script>
