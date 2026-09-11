<template>
  <div
    ref="boardContainerRef"
    class="canvas-board-wrapper relative w-full h-full overflow-hidden bg-bgRoot select-none touch-none"
    :class="{
      'cursor-text': activeTool === 'loose_text',
      'cursor-crosshair': activeTool === 'note' || activeTool === 'shape',
      'cursor-grab': activeTool === 'select' && isSpacePressed,
      'cursor-grabbing': isPanning,
    }"
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
        :is-multi-select="selectedNodeIds.length > 1"
        :zoom="viewport.zoom"
        @select="onSelectNode"
        @drag-start="onNodeDragStart"
        @resize-start="onNodeResizeStart"
        @start-connect="onStartConnect"
        @update-text="onUpdateNodeText"
        @update-color="onUpdateNodeColor"
        @convert-to-note="handleConvertToNote"
        @delete="removeNode"
      />
    </div>

    <!-- Empty State Guide Overlay (Only when no nodes exist and not drawing) -->
    <div
      v-if="nodes.length === 0 && activeTool !== 'pen'"
      class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-in fade-in duration-300 pb-20 sm:pb-0 px-4"
    >
      <div class="p-5 sm:p-6 rounded-2xl bg-bgPanel/85 border border-divider/80 backdrop-blur-md shadow-2xl text-center max-w-sm pointer-events-auto select-none">
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2.5 sm:mb-3 text-lg sm:text-xl font-bold">
          ✨
        </div>
        <h3 class="text-sm md:text-base font-semibold text-textPrimary font-interface">Quadro em branco</h3>
        <p class="text-xs text-textSecondary mt-1.5 mb-4 sm:mb-5 leading-relaxed">
          Dê <strong>dois toques</strong> em qualquer lugar para criar uma nota, ou use as ações rápidas abaixo:
        </p>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button
            class="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-primary hover:bg-primaryHover text-white text-xs font-semibold transition-all shadow-md hover:scale-102 cursor-pointer"
            @click="createInitialNote"
          >
            + Adicionar Bloco
          </button>
          <button
            class="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-bgElevated hover:bg-bgSurface text-textPrimary border border-divider text-xs font-medium transition-all hover:scale-102 cursor-pointer flex items-center gap-1.5"
            @click="openDrawer('notes', true)"
          >
            <span>📝</span>
            <span>Nova Nota</span>
          </button>
          <button
            class="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-bgElevated hover:bg-bgSurface text-textPrimary border border-divider text-xs font-medium transition-all hover:scale-102 cursor-pointer"
            @click="openDrawer('books')"
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
      @open-insert-drawer="openDrawer('books')"
      @create-text-at-center="createLooseTextAtCenter"
      @undo="undo"
      @redo="redo"
      @zoom-in="zoomAt(centerScreen.x, centerScreen.y, 1.2)"
      @zoom-out="zoomAt(centerScreen.x, centerScreen.y, 0.8)"
      @reset-zoom="resetViewport"
      @export="exportAsJsonCanvas"
    />

    <!-- Insert Books, Notes & Quotes Drawer -->
    <CanvasInsertDrawer
      v-if="showInsertDrawer"
      :initial-tab="drawerTab"
      :open-create-note="drawerOpenNewNote"
      :canvas-id="props.canvasId"
      @close="showInsertDrawer = false"
      @insert-book="handleInsertBook"
      @insert-note="handleInsertNote"
      @insert-annotation="handleInsertAnnotation"
    />

    <!-- Marquee Selection Rectangle Overlay -->
    <div
      v-if="isMarqueeSelecting"
      class="absolute pointer-events-none z-20"
      :style="marqueeStyle"
    />

    <!-- Multi-Select Floating Toolbar -->
    <CanvasSelectionToolbar
      :selected-nodes="selectedNodesData"
      :selected-count="selectedNodeIds.length"
      :viewport="viewport"
      @color-selected="onBulkColorChange"
      @delete-selected="removeSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type {
  CanvasNode,
  CanvasEdge,
  CanvasSide,
} from '~/interfaces/canvas';
import { useCanvas } from '~/composables/useCanvas';
import { useNotes } from '~/composables/useNotes';
import { getClosestAnchorSide } from '~/utils/canvasGeometry';

const props = defineProps<{
  canvasId?: string;
}>();

const boardContainerRef = ref<HTMLElement | null>(null);
const showInsertDrawer = ref(false);
const drawerTab = ref<'books' | 'notes' | 'quotes'>('books');
const drawerOpenNewNote = ref(false);

const { createNote } = useNotes();

const openDrawer = (tab: 'books' | 'notes' | 'quotes', openNewNote = false) => {
  drawerTab.value = tab;
  drawerOpenNewNote.value = openNewNote;
  showInsertDrawer.value = true;
};

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
  pushHistory,
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
  hasMoved?: boolean;
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

// Marquee Selection State
const isMarqueeSelecting = ref(false);
const marqueeStart = ref({ x: 0, y: 0 }); // screen coords
const marqueeEnd = ref({ x: 0, y: 0 });   // screen coords

const marqueeStyle = computed(() => {
  const x1 = Math.min(marqueeStart.value.x, marqueeEnd.value.x);
  const y1 = Math.min(marqueeStart.value.y, marqueeEnd.value.y);
  const x2 = Math.max(marqueeStart.value.x, marqueeEnd.value.x);
  const y2 = Math.max(marqueeStart.value.y, marqueeEnd.value.y);
  const rect = boardContainerRef.value?.getBoundingClientRect();
  return {
    left: `${x1 - (rect?.left || 0)}px`,
    top: `${y1 - (rect?.top || 0)}px`,
    width: `${x2 - x1}px`,
    height: `${y2 - y1}px`,
    border: '2px dashed #3B82F6',
    backgroundColor: 'rgba(59,130,246,0.05)',
    borderRadius: '4px',
  };
});

const selectedNodesData = computed(() =>
  nodes.value.filter((n) => selectedNodeIds.value.includes(n.id))
);

// Multi-node drag state
const multiDragState = ref<{
  startX: number;
  startY: number;
  initialPositions: Array<{ id: string; x: number; y: number }>;
  hasMoved?: boolean;
} | null>(null);

// Pending click state when clicking an already-selected node
const pendingNodeClick = ref<{
  id: string;
  isShift: boolean;
  startX: number;
  startY: number;
} | null>(null);

// Bulk color change for multi-selection
const onBulkColorChange = (color: string) => {
  for (const id of selectedNodeIds.value) {
    updateNode(id, { color }, true);
  }
};

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

// Create Free / Loose Text Node (Sem quadrado, escrita livre imediata)
const createLooseTextNode = (canvasX: number, canvasY: number) => {
  const newNode: CanvasNode = {
    id: `node-${Date.now()}`,
    type: 'loose_text',
    x: Math.round(canvasX - 10),
    y: Math.round(canvasY - 14),
    width: 280,
    height: 56,
    text: '',
  };
  addNode(newNode);
  selectedNodeIds.value = [newNode.id];
  selectedEdgeId.value = null;
};

const createLooseTextAtCenter = () => {
  const centerCoords = screenToCanvas(centerScreen.value.x, centerScreen.value.y);
  createLooseTextNode(centerCoords.x, centerCoords.y);
  activeTool.value = 'select';
};

// Background Pointer Down
const onBackgroundPointerDown = (e: PointerEvent) => {
  if (activeTool.value === 'pen') return;

  // Guard: ignore clicks originating from toolbar or insert drawer
  if ((e.target as HTMLElement)?.closest?.('.canvas-toolbar-container')) return;

  const isMiddleClick = e.button === 1;
  const isLeftClick = e.button === 0;

  // Single click with creation tool
  if (isLeftClick && (activeTool.value === 'note' || activeTool.value === 'shape' || activeTool.value === 'loose_text')) {
    const coords = screenToCanvas(e.clientX, e.clientY);
    if (activeTool.value === 'loose_text') {
      e.preventDefault();
      createLooseTextNode(coords.x, coords.y);
      activeTool.value = 'select';
      return;
    }

    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type: activeTool.value === 'shape' ? 'shape' : 'text',
      shape: activeTool.value === 'shape' ? selectedShapeType.value : undefined,
      x: Math.round(coords.x - 100),
      y: Math.round(coords.y - 60),
      width: activeTool.value === 'shape' ? 180 : 240,
      height: activeTool.value === 'shape' ? 120 : 150,
      text: '',
      color: '#E57B55',
    };
    addNode(newNode);
    selectedNodeIds.value = [newNode.id];
    activeTool.value = 'select';
    return;
  }

  // Deselect on empty background click (will be overridden if marquee starts)
  if (isLeftClick && !isSpacePressed.value && activeTool.value === 'select') {
    // Start marquee selection
    marqueeStart.value = { x: e.clientX, y: e.clientY };
    marqueeEnd.value = { x: e.clientX, y: e.clientY };
    isMarqueeSelecting.value = true;
    selectedNodeIds.value = [];
    selectedEdgeId.value = null;
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    return;
  }

  // Deselect on background click for non-select tools
  if (isLeftClick && !isSpacePressed.value) {
    selectedNodeIds.value = [];
    selectedEdgeId.value = null;
  }

  // Pan start (middle click or space + left click only — no more background drag pan)
  if (isMiddleClick || (isSpacePressed.value && isLeftClick)) {
    isPanning.value = true;
    panStart.value = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
  }
};

const onPointerMove = (e: PointerEvent) => {
  // Marquee Selection (updating rectangle + hit-testing nodes)
  if (isMarqueeSelecting.value) {
    marqueeEnd.value = { x: e.clientX, y: e.clientY };
    // Calculate selected nodes within marquee (screen to canvas)
    const topLeft = screenToCanvas(
      Math.min(marqueeStart.value.x, marqueeEnd.value.x),
      Math.min(marqueeStart.value.y, marqueeEnd.value.y)
    );
    const bottomRight = screenToCanvas(
      Math.max(marqueeStart.value.x, marqueeEnd.value.x),
      Math.max(marqueeStart.value.y, marqueeEnd.value.y)
    );
    const hits: string[] = [];
    for (const node of nodes.value) {
      // Check if node intersects marquee rectangle
      if (
        node.x + node.width > topLeft.x &&
        node.x < bottomRight.x &&
        node.y + node.height > topLeft.y &&
        node.y < bottomRight.y
      ) {
        hits.push(node.id);
      }
    }
    selectedNodeIds.value = hits;
    return;
  }

  // Panning Viewport
  if (isPanning.value) {
    const dx = e.clientX - panStart.value.x;
    const dy = e.clientY - panStart.value.y;
    panBy(dx, dy);
    panStart.value = { x: e.clientX, y: e.clientY };
    return;
  }

  // Multi-node drag
  if (multiDragState.value) {
    const rawDist = Math.hypot(
      e.clientX - multiDragState.value.startX,
      e.clientY - multiDragState.value.startY
    );
    if (rawDist > 3) {
      multiDragState.value.hasMoved = true;
    }
    const dx = (e.clientX - multiDragState.value.startX) / viewport.value.zoom;
    const dy = (e.clientY - multiDragState.value.startY) / viewport.value.zoom;
    for (const pos of multiDragState.value.initialPositions) {
      updateNode(pos.id, {
        x: Math.round(pos.x + dx),
        y: Math.round(pos.y + dy),
      });
    }
    return;
  }

  // Dragging Single Node
  if (draggingNodeState.value) {
    const rawDist = Math.hypot(
      e.clientX - draggingNodeState.value.startX,
      e.clientY - draggingNodeState.value.startY
    );
    if (rawDist > 3) {
      draggingNodeState.value.hasMoved = true;
    }
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
  // Finalize marquee selection
  if (isMarqueeSelecting.value) {
    isMarqueeSelecting.value = false;
    // selectedNodeIds are already set during move; keep them
    return;
  }

  if (isPanning.value) {
    isPanning.value = false;
  }

  // Finalize multi-node drag
  if (multiDragState.value) {
    const didMove = multiDragState.value.hasMoved;
    multiDragState.value = null;

    if (!didMove && pendingNodeClick.value) {
      if (pendingNodeClick.value.isShift) {
        selectedNodeIds.value = selectedNodeIds.value.filter((i) => i !== pendingNodeClick.value!.id);
      } else {
        selectedNodeIds.value = [pendingNodeClick.value.id];
      }
    }
    pendingNodeClick.value = null;
    return;
  }

  if (draggingNodeState.value) {
    draggingNodeState.value = null;
  }
  pendingNodeClick.value = null;

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

// Wheel Interaction:
// 1. Clicar + dois dedos para cima/baixo (ou pinch/Ctrl+wheel): Zoom / Deszoom
// 2. Dois dedos apenas (sem clique): Move a tela (Pan 2D)
const onWheel = (e: WheelEvent) => {
  const isClicking = e.buttons !== 0;
  const isPinchOrCtrl = e.ctrlKey || e.metaKey;

  if (isClicking || isPinchOrCtrl) {
    if (isPanning.value) {
      isPanning.value = false;
    }
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    zoomAt(e.clientX, e.clientY, zoomFactor);
    return;
  }

  // Dois dedos apenas movem a tela (pan suave 2D)
  panBy(-e.deltaX, -e.deltaY);
};

// Node Interactions
const onSelectNode = (id: string, isShift: boolean, e?: PointerEvent) => {
  selectedEdgeId.value = null;
  const clientX = e?.clientX ?? 0;
  const clientY = e?.clientY ?? 0;

  if (isShift) {
    if (selectedNodeIds.value.includes(id)) {
      pendingNodeClick.value = { id, isShift: true, startX: clientX, startY: clientY };
    } else {
      selectedNodeIds.value.push(id);
      pendingNodeClick.value = null;
    }
  } else {
    if (selectedNodeIds.value.includes(id) && selectedNodeIds.value.length > 1) {
      pendingNodeClick.value = { id, isShift: false, startX: clientX, startY: clientY };
    } else {
      selectedNodeIds.value = [id];
      pendingNodeClick.value = null;
    }
  }
};

const onNodeDragStart = (id: string, e: PointerEvent) => {
  if (activeTool.value === 'pen') return;
  const node = nodes.value.find((n) => n.id === id);
  if (!node) return;

  // Multi-node drag: if the dragged node is part of a multi-selection
  if (selectedNodeIds.value.length > 1 && selectedNodeIds.value.includes(id)) {
    pushHistory();
    const initialPositions = selectedNodeIds.value
      .map((nid) => {
        const n = nodes.value.find((nd) => nd.id === nid);
        return n ? { id: nid, x: n.x, y: n.y } : null;
      })
      .filter((p): p is { id: string; x: number; y: number } => p !== null);

    multiDragState.value = {
      startX: e.clientX,
      startY: e.clientY,
      initialPositions,
      hasMoved: false,
    };
    boardContainerRef.value?.setPointerCapture?.(e.pointerId);
    return;
  }

  pushHistory();
  draggingNodeState.value = {
    nodeId: id,
    startX: e.clientX,
    startY: e.clientY,
    initialNodeX: node.x,
    initialNodeY: node.y,
    hasMoved: false,
  };
  boardContainerRef.value?.setPointerCapture?.(e.pointerId);
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

const handleInsertNote = (note: any) => {
  const centerCoords = screenToCanvas(centerScreen.value.x, centerScreen.value.y);
  const newNode: CanvasNode = {
    id: `node-${Date.now()}`,
    type: 'note_embed',
    x: Math.round(centerCoords.x - 140),
    y: Math.round(centerCoords.y - 100),
    width: 300,
    height: 200,
    noteId: note.id,
    noteTitle: note.title,
    noteContent: note.content,
    color: '#8B5CF6',
  };
  addNode(newNode);
  showInsertDrawer.value = false;
};

// Converter Bloco de Texto em Nota Persistente do Sistema
const handleConvertToNote = async (nodeId: string) => {
  const node = nodes.value.find((n) => n.id === nodeId);
  if (!node) return;
  const rawText = node.text || '';
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const title = (lines[0] ? lines[0].replace(/^[#\s*->]+/, '').trim().substring(0, 60) : '') || 'Nota do Canvas';
  try {
    const created = await createNote({ title, content: rawText, folder: null, canvasId: props.canvasId });
    updateNode(nodeId, { type: 'note_embed', noteId: created.id, noteTitle: created.title, noteContent: created.content }, true);
  } catch (err) {
    console.error('Erro ao converter bloco em nota:', err);
  }
};

// Keydown Shortcuts
const onKeyDown = (e: KeyboardEvent) => {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement ||
    (e.target as HTMLElement)?.isContentEditable ||
    (e.target as HTMLElement)?.closest?.('.ProseMirror')
  ) {
    return;
  }

  // Move selected nodes with Arrow keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedNodeIds.value.length > 0) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 2;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowUp') dy = -step;
    if (e.key === 'ArrowDown') dy = step;
    if (e.key === 'ArrowLeft') dx = -step;
    if (e.key === 'ArrowRight') dx = step;

    pushHistory();
    for (const id of selectedNodeIds.value) {
      const n = nodes.value.find((nd) => nd.id === id);
      if (n) {
        updateNode(id, { x: n.x + dx, y: n.y + dy });
      }
    }
    return;
  }

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
  } else if (e.key.toLowerCase() === 't') {
    activeTool.value = 'loose_text';
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
