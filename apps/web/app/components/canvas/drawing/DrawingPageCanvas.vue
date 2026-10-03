<template>
  <div
    ref="containerRef"
    class="drawing-page-container relative select-none touch-none shadow-md rounded-b-xl overflow-hidden border border-t-0 border-divider/60 transition-all duration-200"
    :class="[
      isActive ? 'ring-2 ring-primary/40' : 'opacity-95 hover:opacity-100',
      tool === 'select' ? 'cursor-default' : (tool === 'shape' || tool === 'text') ? 'cursor-crosshair' : '',
    ]"
    :style="{
      width: `${displayWidth}px`,
      height: `${displayHeight}px`,
      backgroundColor: backgroundColor,
    }"
    @click="handleContainerClick"
    @pointermove="handleContainerPointerMove"
    @pointerup="handleContainerPointerUp"
  >
    <!-- Background Vector SVG Layer (Pautas, Quadriculado, Pontos) -->
    <svg
      class="drawing-background-layer absolute inset-0 w-full h-full pointer-events-none select-none"
      viewBox="0 0 794 1123"
      shape-rendering="geometricPrecision"
    >
      <rect width="794" height="1123" :fill="backgroundColor" />

      <!-- Padrão Quadriculado (Grid) -->
      <defs v-if="page.backgroundType === 'grid'">
        <pattern id="drawing-grid-pattern" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(0, 0, 0, 0.08)" stroke-width="1" />
        </pattern>
      </defs>
      <rect v-if="page.backgroundType === 'grid'" width="794" height="1123" fill="url(#drawing-grid-pattern)" />

      <!-- Padrão Pontilhado (Dots) -->
      <defs v-if="page.backgroundType === 'dots'">
        <pattern id="drawing-dots-pattern" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="1.2" fill="rgba(0, 0, 0, 0.2)" />
        </pattern>
      </defs>
      <rect v-if="page.backgroundType === 'dots'" width="794" height="1123" fill="url(#drawing-dots-pattern)" />

      <!-- Linhas Pautadas (Ruled) -->
      <g v-if="page.backgroundType === 'ruled'" class="ruled-lines">
        <line
          v-for="y in ruledLineYCoords"
          :key="y"
          x1="44"
          :y1="y"
          x2="750"
          :y2="y"
          stroke="rgba(0, 0, 0, 0.09)"
          stroke-width="1"
        />
      </g>
    </svg>

    <!-- Infinite Nodes & Connections Layer (Scaled to match Page Coordinates) -->
    <div
      class="absolute inset-0 origin-top-left"
      :style="{
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        pointerEvents: isMouseMode ? 'auto' : 'none',
      }"
    >
      <!-- SVG Edge / Connections Layer -->
      <CanvasEdgeLayer
        :nodes="page.nodes || []"
        :edges="page.edges || []"
        :selected-edge-id="selectedEdgeId"
        :connecting-state="connectingState"
        @select-edge="onSelectEdge"
      />

      <!-- DOM Nodes / Shapes / Text Layer -->
      <CanvasNode
        v-for="node in (page.nodes || [])"
        :key="node.id"
        :node="node"
        :is-selected="(selectedNodeIds || []).includes(node.id)"
        :is-multi-select="(selectedNodeIds || []).length > 1"
        :zoom="scale"
        :autofocus-node-id="lastCreatedNodeId"
        @select="onSelectNode"
        @drag-start="onNodeDragStart"
        @resize-start="onNodeResizeStart"
        @start-connect="onStartConnect"
        @update-text="onUpdateNodeText"
        @update-color="onUpdateNodeColor"
        @update-shape="onUpdateNodeShape"
        @delete="onDeleteNode"
      />
    </div>

    <!-- Main Vector Stroke Layer (SVG puro nativo com perfect-freehand) -->
    <svg
      class="drawing-stroke-layer absolute inset-0 w-full h-full pointer-events-none select-none overflow-visible z-10"
      viewBox="0 0 794 1123"
      shape-rendering="geometricPrecision"
    >
      <!-- Traços Concluídos e Persistidos -->
      <g class="persisted-strokes">
        <path
          v-for="stroke in renderedStrokes"
          :key="stroke.id"
          :d="stroke.path"
          :fill="stroke.color"
          :opacity="stroke.opacity"
          :style="stroke.style"
          class="transition-opacity duration-150"
        />
      </g>

      <!-- Traço Ativo em Andamento (Tempo Real) -->
      <g v-if="activeStrokePath" class="active-stroke">
        <path
          :d="activeStrokePath"
          :fill="color"
          :opacity="activeStrokeOpacity"
          :style="currentActiveTool === 'highlighter' ? 'mix-blend-mode: multiply;' : ''"
        />
      </g>
    </svg>

    <!-- Transparent Interaction Layer (Captura de Stylus, Touch e Mouse) -->
    <div
      ref="drawInteractionRef"
      class="drawing-interaction-overlay absolute inset-0 w-full h-full touch-none z-20"
      :class="isDrawingTool ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @pointerenter="handlePointerEnter"
      @lostpointercapture="handlePointerUp"
      @contextmenu.prevent
    />

    <!-- Badge Indicador de Página (Sem blur, visual minimalista Aresta) -->
    <div
      class="absolute bottom-3 right-4 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-bgPanel border border-divider/60 text-textSecondary pointer-events-none shadow-sm flex items-center gap-1.5 z-30"
    >
      <span>Pág. {{ page.pageNumber }}</span>
      <span v-if="page.strokes.length > 0 || (page.nodes && page.nodes.length > 0)" class="w-1.5 h-1.5 rounded-full bg-primary/70"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { DrawingPage, DrawingStroke, DrawingPoint, PenToolType } from '~/interfaces/drawing';
import type { CanvasNode as ICanvasNode, CanvasEdge, CanvasSide, CanvasShapeType } from '~/interfaces/canvas';
import CanvasNode from '~/components/canvas/CanvasNode.vue';
import CanvasEdgeLayer from '~/components/canvas/CanvasEdgeLayer.vue';
import { getClosestAnchorSide } from '~/utils/canvasGeometry';
import { computeVectorStrokePath, svgToDataUrl } from '~/utils/vectorDrawing';

const props = withDefaults(
  defineProps<{
    page: DrawingPage;
    scale?: number;
    tool: PenToolType;
    selectedShapeType?: CanvasShapeType;
    color: string;
    size: number;
    selectedNodeIds?: string[];
    selectedEdgeId?: string | null;
    palmRejection?: boolean;
    isActive?: boolean;
    isDarkMode?: boolean;
    penMode?: boolean;
  }>(),
  {
    scale: 1,
    tool: 'pen',
    selectedShapeType: 'rectangle',
    color: '#E57B55',
    size: 3,
    selectedNodeIds: () => [],
    selectedEdgeId: null,
    palmRejection: true,
    isActive: false,
    isDarkMode: false,
    penMode: false,
  }
);

const emit = defineEmits<{
  (e: 'stroke-added', stroke: DrawingStroke): void;
  (e: 'erase', point: DrawingPoint, radius: number): void;
  (e: 'select-page'): void;
  (e: 'add-node', node: ICanvasNode): void;
  (e: 'update-node', id: string, updates: Partial<ICanvasNode>, saveHistory?: boolean): void;
  (e: 'delete-node', id: string): void;
  (e: 'add-edge', edge: CanvasEdge): void;
  (e: 'select-node', id: string, isShift: boolean): void;
  (e: 'select-edge', id: string | null): void;
  (e: 'update:tool', tool: PenToolType): void;
}>();

const width = 794;
const height = 1123;

const displayWidth = computed(() => Math.round(width * props.scale));
const displayHeight = computed(() => Math.round(height * props.scale));

const isDrawingTool = computed(() =>
  props.tool === 'pen' ||
  props.tool === 'highlighter' ||
  props.tool === 'eraser' ||
  props.tool === 'pencil' ||
  props.tool === 'fountain'
);

const isMouseMode = computed(() =>
  props.tool === 'select' || props.tool === 'shape' || props.tool === 'text'
);

const containerRef = ref<HTMLElement | null>(null);
const drawInteractionRef = ref<HTMLElement | null>(null);

const isDrawing = ref(false);
const isErasing = ref(false);
const activeStrokePoints = ref<DrawingPoint[]>([]);
const currentActiveTool = ref<PenToolType>('pen');
const lastCreatedNodeId = ref<string | null>(null);

const backgroundColor = '#FFFFFF';

// Linhas pautadas espaçadas a cada 32px
const ruledLineYCoords = computed(() => {
  const coords: number[] = [];
  for (let y = 80; y <= 1080; y += 32) {
    coords.push(y);
  }
  return coords;
});

// Traços persistidos com computação de caminho SVG direto
const renderedStrokes = computed(() => {
  return (props.page.strokes || []).map((stroke, index) => {
    const path = stroke.path || computeVectorStrokePath(stroke.points, stroke.tool || 'pen', stroke.size || 3);
    const opacity = stroke.opacity ?? (stroke.tool === 'highlighter' ? 0.35 : stroke.tool === 'pencil' ? 0.65 : 1);
    const style = stroke.tool === 'highlighter' ? 'mix-blend-mode: multiply;' : '';
    return {
      id: stroke.id || `stroke-${index}`,
      path,
      color: stroke.color || '#E57B55',
      opacity,
      style,
      tool: stroke.tool,
    };
  });
});

// Traço ativo em tempo real
const activeStrokePath = computed(() => {
  if (!isDrawing.value || !activeStrokePoints.value.length) return '';
  return computeVectorStrokePath(activeStrokePoints.value, currentActiveTool.value, props.size);
});

const activeStrokeOpacity = computed(() => {
  if (currentActiveTool.value === 'highlighter') return 0.35;
  if (currentActiveTool.value === 'pencil') return 0.65;
  return 1;
});

// Estados de conexão de arestas e movimentação/redimensionamento de nós
const connectingState = ref<{
  fromNodeId: string;
  fromSide: CanvasSide;
  currentX: number;
  currentY: number;
} | null>(null);

const draggingNodeState = ref<{
  nodeId: string;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
} | null>(null);

const resizingNodeState = ref<{
  nodeId: string;
  handle: string;
  startX: number;
  startY: number;
  initialW: number;
  initialH: number;
  initialX: number;
  initialY: number;
} | null>(null);

// Converte coordenadas do evento para espaço de coordenadas intrínseco da folha (794x1123)
function getCanvasPoint(e: MouseEvent | PointerEvent): DrawingPoint {
  const container = containerRef.value;
  if (!container) return { x: 0, y: 0 };
  const rect = container.getBoundingClientRect();
  const scaleX = width / rect.width;
  const scaleY = height / rect.height;
  return {
    x: Math.round((e.clientX - rect.left) * scaleX * 10) / 10,
    y: Math.round((e.clientY - rect.top) * scaleY * 10) / 10,
    pressure: (e as PointerEvent).pressure || 0.5,
  };
}

// Handlers de Nós & Conexões
function onSelectNode(id: string, isShift: boolean) {
  emit('select-node', id, isShift);
}

function onSelectEdge(id: string) {
  emit('select-edge', id);
}

function onNodeDragStart(id: string, e: PointerEvent) {
  const node = (props.page.nodes || []).find((n) => n.id === id);
  if (!node) return;
  draggingNodeState.value = {
    nodeId: id,
    startX: e.clientX,
    startY: e.clientY,
    initialX: node.x,
    initialY: node.y,
  };
}

function onNodeResizeStart(id: string, handle: string, e: PointerEvent) {
  const node = (props.page.nodes || []).find((n) => n.id === id);
  if (!node) return;
  resizingNodeState.value = {
    nodeId: id,
    handle,
    startX: e.clientX,
    startY: e.clientY,
    initialW: node.width,
    initialH: node.height,
    initialX: node.x,
    initialY: node.y,
  };
}

function onStartConnect(nodeId: string, side: CanvasSide, e: PointerEvent) {
  const pt = getCanvasPoint(e);
  connectingState.value = {
    fromNodeId: nodeId,
    fromSide: side,
    currentX: pt.x,
    currentY: pt.y,
  };
}

function onUpdateNodeText(id: string, text: string) {
  emit('update-node', id, { text }, true);
}

function onUpdateNodeColor(id: string, color: string) {
  emit('update-node', id, { color }, true);
}

function onUpdateNodeShape(id: string, shape: CanvasShapeType) {
  emit('update-node', id, { shape }, true);
}

function onDeleteNode(id: string) {
  emit('delete-node', id);
}

function handleContainerClick(e: MouseEvent) {
  emit('select-page');

  // Ignora se clicou dentro de um nó, botão ou textarea
  const target = e.target as HTMLElement | null;
  if (target?.closest('.canvas-node') || target?.closest('button') || target?.closest('textarea')) {
    return;
  }

  if (props.tool === 'shape') {
    const pt = getCanvasPoint(e);
    const newNode: ICanvasNode = {
      id: `node-${Date.now()}`,
      type: 'shape',
      shape: props.selectedShapeType || 'rectangle',
      x: Math.max(10, Math.min(width - 190, Math.round(pt.x - 90))),
      y: Math.max(10, Math.min(height - 130, Math.round(pt.y - 60))),
      width: 180,
      height: 120,
      text: '',
      color: props.color || '#E57B55',
    };
    lastCreatedNodeId.value = newNode.id;
    emit('add-node', newNode);
    emit('update:tool', 'select');
    return;
  }

  if (props.tool === 'text') {
    const pt = getCanvasPoint(e);
    const newNode: ICanvasNode = {
      id: `node-${Date.now()}`,
      type: 'loose_text',
      x: Math.max(10, Math.min(width - 210, Math.round(pt.x - 10))),
      y: Math.max(10, Math.min(height - 50, Math.round(pt.y - 15))),
      width: 200,
      height: 48,
      text: '',
      color: props.color || '#18181B',
    };
    lastCreatedNodeId.value = newNode.id;
    emit('add-node', newNode);
    emit('update:tool', 'select');
    return;
  }

  if (props.tool === 'select') {
    emit('select-node', '', false);
    emit('select-edge', null);
  }
}

function handleContainerPointerMove(e: PointerEvent) {
  // Puxando aresta conectora
  if (connectingState.value) {
    const pt = getCanvasPoint(e);
    connectingState.value.currentX = pt.x;
    connectingState.value.currentY = pt.y;
    return;
  }

  // Movimentando nó
  if (draggingNodeState.value) {
    const dx = (e.clientX - draggingNodeState.value.startX) / props.scale;
    const dy = (e.clientY - draggingNodeState.value.startY) / props.scale;
    const newX = Math.max(0, Math.min(width - 40, Math.round(draggingNodeState.value.initialX + dx)));
    const newY = Math.max(0, Math.min(height - 40, Math.round(draggingNodeState.value.initialY + dy)));
    emit('update-node', draggingNodeState.value.nodeId, { x: newX, y: newY }, false);
    return;
  }

  // Redimensionando nó
  if (resizingNodeState.value) {
    const dx = (e.clientX - resizingNodeState.value.startX) / props.scale;
    const dy = (e.clientY - resizingNodeState.value.startY) / props.scale;
    const { handle, initialW, initialH, initialX, initialY, nodeId } = resizingNodeState.value;
    let newW = initialW;
    let newH = initialH;
    let newX = initialX;
    let newY = initialY;

    if (handle.includes('e')) newW = Math.max(60, initialW + dx);
    if (handle.includes('s')) newH = Math.max(40, initialH + dy);
    if (handle.includes('w')) {
      const calculatedW = Math.max(60, initialW - dx);
      newX = initialX + (initialW - calculatedW);
      newW = calculatedW;
    }
    if (handle.includes('n')) {
      const calculatedH = Math.max(40, initialH - dy);
      newY = initialY + (initialH - calculatedH);
      newH = calculatedH;
    }
    emit(
      'update-node',
      nodeId,
      { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) },
      false
    );
  }
}

function handleContainerPointerUp(e: PointerEvent) {
  if (connectingState.value) {
    const pt = getCanvasPoint(e);
    const targetNode = (props.page.nodes || []).find(
      (n) =>
        n.id !== connectingState.value!.fromNodeId &&
        pt.x >= n.x &&
        pt.x <= n.x + n.width &&
        pt.y >= n.y &&
        pt.y <= n.y + n.height
    );

    if (targetNode) {
      const targetSide = getClosestAnchorSide(pt.x, pt.y, targetNode);
      const newEdge: CanvasEdge = {
        id: `edge-${Date.now()}`,
        fromNode: connectingState.value.fromNodeId,
        fromSide: connectingState.value.fromSide,
        toNode: targetNode.id,
        toSide: targetSide,
        toEnd: 'arrow',
      };
      emit('add-edge', newEdge);
    }
    connectingState.value = null;
  }

  if (draggingNodeState.value) {
    draggingNodeState.value = null;
  }

  if (resizingNodeState.value) {
    resizingNodeState.value = null;
  }
}

// Handlers de Pointer Events (Rejeição de Palma + Isolamento Multi-Touch + Botão Stylus S-Pen)
const activePointerId = ref<number | null>(null);
const activeTouchPointers = new Map<number, { x: number; y: number }>();
const isPinchActive = ref(false);
let lastPinchEndTime = 0;
const PINCH_COOLDOWN_MS = 200;

function abortCurrentStroke() {
  if (isDrawing.value || isErasing.value) {
    isDrawing.value = false;
    isErasing.value = false;
    activeStrokePoints.value = [];
    if (activePointerId.value !== null && drawInteractionRef.value) {
      try {
        if (drawInteractionRef.value.hasPointerCapture?.(activePointerId.value)) {
          drawInteractionRef.value.releasePointerCapture(activePointerId.value);
        }
      } catch {}
    }
    activePointerId.value = null;
  }
}

function handlePointerEnter(e: PointerEvent) {
  if ((isDrawing.value || isErasing.value) && e.pointerType === 'mouse' && e.buttons === 0) {
    handlePointerUp(e);
  }
}

function handlePointerDown(e: PointerEvent) {
  emit('select-page');

  if (!isDrawingTool.value) return;

  const pType = e.pointerType || (e as any).detail?.pointerType || 'mouse';

  if (props.penMode && pType === 'touch') {
    return;
  }

  if (pType === 'touch') {
    activeTouchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activeTouchPointers.size >= 2) {
      isPinchActive.value = true;
      abortCurrentStroke();
      return;
    }

    if (Date.now() - lastPinchEndTime < PINCH_COOLDOWN_MS) {
      return;
    }

    if (props.palmRejection) {
      if ((e.width && e.width > 25) || (e.height && e.height > 25)) {
        return;
      }
    }
  }

  if (e.pointerType === 'mouse' && e.button !== 0) {
    return;
  }

  if (isDrawing.value && activePointerId.value !== null && activePointerId.value !== e.pointerId) {
    return;
  }

  activePointerId.value = e.pointerId;
  try {
    ((e.currentTarget as HTMLElement) || (e.target as HTMLElement))?.setPointerCapture?.(e.pointerId);
  } catch {}

  const isStylusButtonPressed = (e.buttons & 2) !== 0 || (e.buttons & 32) !== 0;

  if (props.tool === 'eraser' || isStylusButtonPressed) {
    isErasing.value = true;
    const pt = getCanvasPoint(e);
    emit('erase', pt, props.size * 5);
    return;
  }

  isDrawing.value = true;
  currentActiveTool.value = props.tool;
  const pt = getCanvasPoint(e);
  activeStrokePoints.value = [pt];
}

function handlePointerMove(e: PointerEvent) {
  if (!isDrawingTool.value) return;

  const pType = e.pointerType || (e as any).detail?.pointerType || 'mouse';

  if (props.penMode && pType === 'touch') {
    return;
  }

  if (pType === 'touch') {
    if (activeTouchPointers.has(e.pointerId)) {
      activeTouchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (isPinchActive.value || activeTouchPointers.size >= 2) {
      abortCurrentStroke();
      return;
    }

    if (activePointerId.value !== null && e.pointerId !== activePointerId.value) {
      return;
    }
  }

  if (activePointerId.value !== null && e.pointerId !== activePointerId.value) {
    return;
  }

  if ((isDrawing.value || isErasing.value) && pType === 'mouse' && e.buttons === 0) {
    handlePointerUp(e);
    return;
  }

  const isStylusButtonPressed = (e.buttons & 2) !== 0 || (e.buttons & 32) !== 0;

  if (isErasing.value || (props.tool === 'eraser' && (e.buttons & 1) !== 0) || isStylusButtonPressed) {
    const pt = getCanvasPoint(e);
    emit('erase', pt, props.size * 5);
    return;
  }

  if (!isDrawing.value) return;

  const pt = getCanvasPoint(e);
  activeStrokePoints.value.push(pt);
}

function handlePointerUp(e?: PointerEvent) {
  const pType = e?.pointerType || (e as any)?.detail?.pointerType;

  if (props.penMode && pType === 'touch') {
    return;
  }

  if (e && pType === 'touch') {
    activeTouchPointers.delete(e.pointerId);

    if (isPinchActive.value) {
      if (activeTouchPointers.size < 2) {
        isPinchActive.value = false;
        lastPinchEndTime = Date.now();
      }
      abortCurrentStroke();
      return;
    }
  }

  const pointerId = e?.pointerId ?? activePointerId.value;
  if (pointerId !== null && drawInteractionRef.value && drawInteractionRef.value.hasPointerCapture?.(pointerId)) {
    try {
      drawInteractionRef.value.releasePointerCapture(pointerId);
    } catch {}
  }

  if (pointerId !== null && activePointerId.value !== null && pointerId !== activePointerId.value) {
    return;
  }

  activePointerId.value = null;

  if (isErasing.value) {
    isErasing.value = false;
    return;
  }

  if (!isDrawing.value) return;

  isDrawing.value = false;
  if (activeStrokePoints.value.length > 0) {
    const path = computeVectorStrokePath(activeStrokePoints.value, currentActiveTool.value, props.size);
    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tool: currentActiveTool.value,
      color: props.color,
      size: props.size,
      opacity: currentActiveTool.value === 'highlighter' ? 0.35 : currentActiveTool.value === 'pencil' ? 0.65 : 1,
      points: [...activeStrokePoints.value],
      path,
    };
    emit('stroke-added', newStroke);
  }

  activeStrokePoints.value = [];
}

function handleGlobalPointerUp(e: PointerEvent) {
  if (e.pointerType === 'touch') {
    activeTouchPointers.delete(e.pointerId);
    if (activeTouchPointers.size === 0) {
      isPinchActive.value = false;
    }
  }

  if (isDrawing.value || isErasing.value) {
    handlePointerUp(e);
  }
}

function handleWindowBlur() {
  activeTouchPointers.clear();
  isPinchActive.value = false;
  if (isDrawing.value || isErasing.value) {
    handlePointerUp();
  }
}

/**
 * Gera a string SVG vetorial completa e autocontida da página.
 */
function exportToSvgString(): string {
  const strokesXml = (props.page.strokes || [])
    .map((s) => {
      const path = s.path || computeVectorStrokePath(s.points, s.tool || 'pen', s.size || 3);
      const opacity = s.opacity ?? (s.tool === 'highlighter' ? 0.35 : s.tool === 'pencil' ? 0.65 : 1);
      const style = s.tool === 'highlighter' ? 'style="mix-blend-mode: multiply;"' : '';
      return `    <path d="${path}" fill="${s.color || '#E57B55'}" opacity="${opacity}" ${style} />`;
    })
    .join('\n');

  const nodesXml = (props.page.nodes || [])
    .map((n) => {
      const safeText = (n.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (n.type === 'shape') {
        if (n.shape === 'ellipse') {
          return `    <ellipse cx="${n.x + n.width / 2}" cy="${n.y + n.height / 2}" rx="${n.width / 2}" ry="${n.height / 2}" fill="${n.color || '#E57B55'}22" stroke="${n.color || '#E57B55'}" stroke-width="2" />
    <text x="${n.x + n.width / 2}" y="${n.y + n.height / 2}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="14" fill="#18181B">${safeText}</text>`;
        }
        return `    <rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="8" fill="${n.color || '#E57B55'}22" stroke="${n.color || '#E57B55'}" stroke-width="2" />
    <text x="${n.x + n.width / 2}" y="${n.y + n.height / 2}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="14" fill="#18181B">${safeText}</text>`;
      }
      return `    <text x="${n.x}" y="${n.y + 20}" font-family="sans-serif" font-size="14" fill="${n.color || '#18181B'}">${safeText}</text>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 794 1123" width="794" height="1123" shape-rendering="geometricPrecision">
  <rect width="794" height="1123" fill="#FFFFFF" />
  <g id="strokes">
${strokesXml}
  </g>
  <g id="nodes">
${nodesXml}
  </g>
</svg>`;
}

/**
 * Retorna o DataURL vetorial SVG UTF-8 para pré-visualização ultraleve e nítida.
 */
function exportToDataUrl(): string {
  return svgToDataUrl(exportToSvgString());
}

defineExpose({
  exportToSvgString,
  exportToDataUrl,
});

onMounted(() => {
  window.addEventListener('pointerup', handleGlobalPointerUp);
  window.addEventListener('pointercancel', handleGlobalPointerUp);
  window.addEventListener('blur', handleWindowBlur);
});

onUnmounted(() => {
  window.removeEventListener('pointerup', handleGlobalPointerUp);
  window.removeEventListener('pointercancel', handleGlobalPointerUp);
  window.removeEventListener('blur', handleWindowBlur);
});
</script>
