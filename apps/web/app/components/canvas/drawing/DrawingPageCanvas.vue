<template>
  <div
    class="relative select-none touch-none shadow-md rounded-b-xl overflow-hidden border border-t-0 border-divider/60 transition-all duration-200"
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
    <!-- Background Canvas (Pautas, Quadriculado, Pontos) -->
    <canvas
      ref="bgCanvasRef"
      :width="width"
      :height="height"
      class="absolute inset-0 w-full h-full pointer-events-none"
    />

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

    <!-- Main Drawing Canvas (Traços com perfect-freehand) -->
    <canvas
      ref="drawCanvasRef"
      :width="width"
      :height="height"
      class="absolute inset-0 w-full h-full touch-none"
      :class="isDrawingTool ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @pointerenter="handlePointerEnter"
      @lostpointercapture="handlePointerUp"
      @contextmenu.prevent
    />

    <!-- Badge Indicador de Página -->
    <div
      class="absolute bottom-3 right-4 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-bgPanel/80 backdrop-blur-sm border border-divider/40 text-textSecondary pointer-events-none shadow-sm flex items-center gap-1.5 z-20"
    >
      <span>Pág. {{ page.pageNumber }}</span>
      <span v-if="page.strokes.length > 0 || (page.nodes && page.nodes.length > 0)" class="w-1.5 h-1.5 rounded-full bg-primary/70"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { getStroke } from 'perfect-freehand';
import type { DrawingPage, DrawingStroke, DrawingPoint, PenToolType } from '~/interfaces/drawing';
import type { CanvasNode as ICanvasNode, CanvasEdge, CanvasSide, CanvasShapeType } from '~/interfaces/canvas';
import CanvasNode from '~/components/canvas/CanvasNode.vue';
import CanvasEdgeLayer from '~/components/canvas/CanvasEdgeLayer.vue';
import { getClosestAnchorSide } from '~/utils/canvasGeometry';

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

const bgCanvasRef = ref<HTMLCanvasElement | null>(null);
const drawCanvasRef = ref<HTMLCanvasElement | null>(null);

const isDrawing = ref(false);
const isErasing = ref(false);
const activeStrokePoints = ref<DrawingPoint[]>([]);
const currentActiveTool = ref<PenToolType>('pen');
const lastCreatedNodeId = ref<string | null>(null);

const backgroundColor = '#FFFFFF';

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
  const canvas = drawCanvasRef.value || bgCanvasRef.value;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const scaleX = width / rect.width;
  const scaleY = height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
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
  // Concluir conexão de aresta se soltou sobre outro nó
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

// Renderiza o fundo: folha toda branca e lisa sem linhas
function renderBackground() {
  const canvas = bgCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
}

// Renderiza todos os traços no Canvas principal
function renderStrokes() {
  const canvas = drawCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  // Renderiza traços persistidos
  for (const stroke of props.page.strokes) {
    drawSingleStroke(ctx, stroke.points, stroke.tool, stroke.color, stroke.size, stroke.opacity);
  }

  // Renderiza traço ativo sendo desenhado agora
  if (isDrawing.value && activeStrokePoints.value.length > 0) {
    drawSingleStroke(
      ctx,
      activeStrokePoints.value,
      currentActiveTool.value,
      props.color,
      props.size,
      currentActiveTool.value === 'highlighter' ? 0.35 : currentActiveTool.value === 'pencil' ? 0.65 : 1
    );
  }
}

function getSvgPathFromStroke(strokePoints: number[][]): string {
  if (!strokePoints.length) return '';

  const firstPt = strokePoints[0] || [0, 0];
  const firstX = firstPt[0] ?? 0;
  const firstY = firstPt[1] ?? 0;
  const initialAcc: (string | number)[] = ['M', firstX, firstY, 'Q'];

  const d = strokePoints.reduce<(string | number)[]>(
    (acc, pt, i, arr) => {
      const x0 = pt[0] ?? 0;
      const y0 = pt[1] ?? 0;
      const next = arr[(i + 1) % arr.length] || [x0, y0];
      const x1 = next[0] ?? 0;
      const y1 = next[1] ?? 0;
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    initialAcc
  );

  d.push('Z');
  return d.join(' ');
}

function drawSingleStroke(
  ctx: CanvasRenderingContext2D,
  points: DrawingPoint[],
  tool: PenToolType,
  color: string,
  size: number,
  opacity: number = 1
) {
  if (!points || points.length === 0) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;

  if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
  } else if (tool === 'highlighter') {
    ctx.globalCompositeOperation = 'multiply';
  } else {
    ctx.globalCompositeOperation = 'source-over';
  }

  const rawPoints = points.map((p) => [p.x, p.y]);
  const strokeOptions = {
    size: tool === 'highlighter' ? size * 4 : size * 2,
    thinning: tool === 'pencil' ? 0.6 : 0.4,
    smoothing: 0.65,
    streamline: 0.55,
    easing: (t: number) => t,
    start: { taper: 0, cap: true },
    end: { taper: 0, cap: true },
  };

  const outlinePoints = getStroke(rawPoints, strokeOptions);
  const pathData = getSvgPathFromStroke(outlinePoints);

  if (pathData) {
    const path = new Path2D(pathData);
    ctx.fill(path);
  }

  ctx.restore();
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
    if (activePointerId.value !== null && drawCanvasRef.value) {
      try {
        if (drawCanvasRef.value.hasPointerCapture?.(activePointerId.value)) {
          drawCanvasRef.value.releasePointerCapture(activePointerId.value);
        }
      } catch {
        // Ignora erro ao liberar captura
      }
    }
    activePointerId.value = null;
    renderStrokes();
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
  if (pType === 'touch') {
    activeTouchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Se 2 ou mais dedos tocarem a tela: ABORTA IMEDIATAMENTE qualquer traço em andamento
    if (activeTouchPointers.size >= 2) {
      isPinchActive.value = true;
      abortCurrentStroke();
      return;
    }

    // Janela de cooldown pós-pinch para evitar que soltar um dedo antes do outro inicie um traço
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

  // Se já há um traço em andamento com outro ponteiro, ignora este evento
  if (isDrawing.value && activePointerId.value !== null && activePointerId.value !== e.pointerId) {
    return;
  }

  activePointerId.value = e.pointerId;
  try {
    ((e.currentTarget as HTMLElement) || (e.target as HTMLElement))?.setPointerCapture?.(e.pointerId);
  } catch {
    // Ignora se o ambiente não suportar captura de ponteiro
  }

  const isStylusButtonPressed = (e.buttons & 2) !== 0 || (e.buttons & 32) !== 0;

  if (props.tool === 'eraser' || isStylusButtonPressed) {
    isErasing.value = true;
    const pt = getCanvasPoint(e);
    emit('erase', pt, props.size * 5);
    renderStrokes();
    return;
  }

  isDrawing.value = true;
  currentActiveTool.value = props.tool;
  const pt = getCanvasPoint(e);
  activeStrokePoints.value = [pt];
  renderStrokes();
}

function handlePointerMove(e: PointerEvent) {
  if (!isDrawingTool.value) return;

  const pType = e.pointerType || (e as any).detail?.pointerType || 'mouse';

  // Atualiza coordenadas no rastreador de toques
  if (pType === 'touch') {
    if (activeTouchPointers.has(e.pointerId)) {
      activeTouchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Se estiver em modo pinch ou houver múltiplos dedos na tela, garante que nenhum traço seja desenhado
    if (isPinchActive.value || activeTouchPointers.size >= 2) {
      abortCurrentStroke();
      return;
    }

    // Ignora eventos de ponteiros touch que não sejam o ponteiro ativo que iniciou o traço
    if (activePointerId.value !== null && e.pointerId !== activePointerId.value) {
      return;
    }
  }

  // Ignora movimentos de ponteiro mouse/pen que não correspondam ao ativo
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
    renderStrokes();
    return;
  }

  if (!isDrawing.value) return;

  const pt = getCanvasPoint(e);
  activeStrokePoints.value.push(pt);
  renderStrokes();
}

function handlePointerUp(e?: PointerEvent) {
  const pType = e?.pointerType || (e as any)?.detail?.pointerType;
  if (e && pType === 'touch') {
    activeTouchPointers.delete(e.pointerId);

    // Se estava em pinch e os dedos estão sendo levantados
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
  if (pointerId !== null && drawCanvasRef.value && drawCanvasRef.value.hasPointerCapture?.(pointerId)) {
    try {
      drawCanvasRef.value.releasePointerCapture(pointerId);
    } catch {
      // Ignora erro ao liberar captura
    }
  }

  // Se o ponteiro que subiu não é o ativo, apenas registra soltura
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
    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tool: currentActiveTool.value,
      color: props.color,
      size: props.size,
      opacity: currentActiveTool.value === 'highlighter' ? 0.35 : currentActiveTool.value === 'pencil' ? 0.65 : 1,
      points: [...activeStrokePoints.value],
    };
    emit('stroke-added', newStroke);
  }

  activeStrokePoints.value = [];
  renderStrokes();
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

// Exporta a página inteira combinando fundo, traços e nós para PNG para a IA
function exportToDataUrl(): string {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  const exportCtx = exportCanvas.getContext('2d');
  if (!exportCtx) return '';

  exportCtx.fillStyle = '#FFFFFF';
  exportCtx.fillRect(0, 0, width, height);

  if (bgCanvasRef.value) {
    exportCtx.drawImage(bgCanvasRef.value, 0, 0);
  }

  // Desenha os nós (formas e textos) no canvas da imagem
  if (props.page.nodes && props.page.nodes.length > 0) {
    for (const node of props.page.nodes) {
      exportCtx.save();
      exportCtx.strokeStyle = node.color || '#E57B55';
      exportCtx.fillStyle = `${node.color || '#E57B55'}22`;
      exportCtx.lineWidth = 2;

      if (node.type === 'shape') {
        if (node.shape === 'ellipse') {
          exportCtx.beginPath();
          exportCtx.ellipse(node.x + node.width / 2, node.y + node.height / 2, node.width / 2 - 2, node.height / 2 - 2, 0, 0, Math.PI * 2);
          exportCtx.fill();
          exportCtx.stroke();
        } else if (node.shape === 'diamond') {
          exportCtx.beginPath();
          exportCtx.moveTo(node.x + node.width / 2, node.y + 2);
          exportCtx.lineTo(node.x + node.width - 2, node.y + node.height / 2);
          exportCtx.lineTo(node.x + node.width / 2, node.y + node.height - 2);
          exportCtx.lineTo(node.x + 2, node.y + node.height / 2);
          exportCtx.closePath();
          exportCtx.fill();
          exportCtx.stroke();
        } else if (node.shape === 'triangle') {
          exportCtx.beginPath();
          exportCtx.moveTo(node.x + node.width / 2, node.y + 2);
          exportCtx.lineTo(node.x + node.width - 2, node.y + node.height - 2);
          exportCtx.lineTo(node.x + 2, node.y + node.height - 2);
          exportCtx.closePath();
          exportCtx.fill();
          exportCtx.stroke();
        } else {
          exportCtx.beginPath();
          exportCtx.roundRect(node.x + 2, node.y + 2, node.width - 4, node.height - 4, 8);
          exportCtx.fill();
          exportCtx.stroke();
        }
      }

      if (node.text) {
        exportCtx.fillStyle = '#18181B';
        exportCtx.font = '14px sans-serif';
        exportCtx.textAlign = 'center';
        exportCtx.textBaseline = 'middle';
        exportCtx.fillText(node.text, node.x + node.width / 2, node.y + node.height / 2);
      }
      exportCtx.restore();
    }
  }

  // Traços manuais
  if (drawCanvasRef.value) {
    exportCtx.drawImage(drawCanvasRef.value, 0, 0);
  }

  return exportCanvas.toDataURL('image/png');
}

defineExpose({
  exportToDataUrl,
  renderStrokes,
  renderBackground,
});

watch(
  () => [props.page.strokes, props.isDarkMode],
  () => {
    nextTick(() => {
      renderStrokes();
    });
  },
  { deep: true }
);

watch(
  () => [props.page.backgroundType, props.isDarkMode],
  () => {
    nextTick(() => {
      renderBackground();
    });
  }
);

onMounted(() => {
  renderBackground();
  renderStrokes();
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
