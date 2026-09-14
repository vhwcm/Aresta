<template>
  <div
    class="relative select-none touch-none shadow-md rounded-lg overflow-hidden border border-divider/60 transition-all duration-200"
    :class="[
      isActive ? 'ring-2 ring-primary/40' : 'opacity-95 hover:opacity-100',
    ]"
    :style="{
      width: `${displayWidth}px`,
      height: `${displayHeight}px`,
      backgroundColor: backgroundColor,
    }"
    @click="$emit('select-page')"
  >
    <!-- Background Canvas (Pautas, Quadriculado, Pontos) -->
    <canvas
      ref="bgCanvasRef"
      :width="width"
      :height="height"
      class="absolute inset-0 w-full h-full pointer-events-none"
    />

    <!-- Main Drawing Canvas (Traços com perfect-freehand) -->
    <canvas
      ref="drawCanvasRef"
      :width="width"
      :height="height"
      class="absolute inset-0 w-full h-full cursor-crosshair touch-none"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @contextmenu.prevent
    />

    <!-- Badge Indicador de Página -->
    <div
      class="absolute bottom-3 right-4 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-bgPanel/80 backdrop-blur-sm border border-divider/40 text-textSecondary pointer-events-none shadow-sm flex items-center gap-1.5"
    >
      <span>Pág. {{ page.pageNumber }}</span>
      <span v-if="page.strokes.length > 0" class="w-1.5 h-1.5 rounded-full bg-primary/70"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { getStroke } from 'perfect-freehand';
import type { DrawingPage, DrawingStroke, DrawingPoint, PenToolType } from '~/interfaces/drawing';

const props = withDefaults(
  defineProps<{
    page: DrawingPage;
    scale?: number;
    tool: PenToolType;
    color: string;
    size: number;
    palmRejection?: boolean;
    isActive?: boolean;
    isDarkMode?: boolean;
  }>(),
  {
    scale: 1,
    tool: 'pen',
    color: '#E57B55',
    size: 3,
    palmRejection: true,
    isActive: false,
    isDarkMode: false,
  }
);

const emit = defineEmits<{
  (e: 'stroke-added', stroke: DrawingStroke): void;
  (e: 'erase', point: DrawingPoint, radius: number): void;
  (e: 'select-page'): void;
}>();

const width = 794;
const height = 1123;

const displayWidth = computed(() => Math.round(width * props.scale));
const displayHeight = computed(() => Math.round(height * props.scale));

const bgCanvasRef = ref<HTMLCanvasElement | null>(null);
const drawCanvasRef = ref<HTMLCanvasElement | null>(null);

const isDrawing = ref(false);
const isErasing = ref(false);
const activeStrokePoints = ref<DrawingPoint[]>([]);
const currentActiveTool = ref<PenToolType>('pen');

const backgroundColor = computed(() => (props.isDarkMode ? '#1e1f22' : '#ffffff'));

// Gera o traço SVG/Path uniforme e limpo sem sensibilidade de pressão
function getSvgPathFromStroke(strokePoints: number[][]): string {
  if (!strokePoints.length) return '';
  const d = strokePoints.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]!;
      acc.push(x0!, y0!, (x0! + x1!) / 2, (y0! + y1!) / 2);
      return acc;
    },
    ['M', ...strokePoints[0]!, 'Q']
  );
  d.push('Z');
  return d.join(' ');
}

// Renderiza o fundo pautado, quadriculado ou pontilhado
function renderBackground() {
  const canvas = bgCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  const lineColor = props.isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const marginColor = props.isDarkMode ? 'rgba(229, 123, 85, 0.25)' : 'rgba(229, 123, 85, 0.2)';

  if (props.page.backgroundType === 'ruled') {
    const spacing = 32;
    const topMargin = 80;
    const bottomMargin = height - 40;

    // Linha de margem esquerda estilo caderno clássico
    ctx.strokeStyle = marginColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(85, topMargin - 20);
    ctx.lineTo(85, bottomMargin);
    ctx.stroke();

    // Linhas horizontais
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = topMargin; y <= bottomMargin; y += spacing) {
      ctx.moveTo(40, y);
      ctx.lineTo(width - 40, y);
    }
    ctx.stroke();
  } else if (props.page.backgroundType === 'grid') {
    const gridSize = 28;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    for (let x = 30; x <= width - 30; x += gridSize) {
      ctx.moveTo(x, 30);
      ctx.lineTo(x, height - 30);
    }
    for (let y = 30; y <= height - 30; y += gridSize) {
      ctx.moveTo(30, y);
      ctx.lineTo(width - 30, y);
    }
    ctx.stroke();
  } else if (props.page.backgroundType === 'dots') {
    const dotSpacing = 28;
    ctx.fillStyle = props.isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.18)';
    for (let x = 35; x <= width - 35; x += dotSpacing) {
      for (let y = 35; y <= height - 35; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
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

  if (tool === 'highlighter') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
  } else if (tool === 'pencil') {
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
  } else {
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
  }

  // Traço perfeitamente uniforme sem sensibilidade de pressão
  const strokeOptions = {
    size: tool === 'highlighter' ? size * 3.5 : tool === 'pencil' ? size * 1.2 : size,
    thinning: 0, // Uniforme sem variação brusca de espessura
    smoothing: 0.5,
    streamline: 0.55,
    simulatePressure: false,
  };

  const outlinePoints = getStroke(
    points.map((p) => [p.x, p.y]),
    strokeOptions
  );

  const pathData = getSvgPathFromStroke(outlinePoints);
  if (pathData) {
    const path2D = new Path2D(pathData);
    ctx.fill(path2D);
  }

  ctx.restore();
}

// Converte coordenadas da tela para o sistema interno do Canvas
function getCanvasPoint(e: PointerEvent): DrawingPoint {
  const canvas = drawCanvasRef.value;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const scaleX = width / rect.width;
  const scaleY = height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

// Handlers de Pointer Events (Rejeição de Palma + Botão Stylus S-Pen)
function handlePointerDown(e: PointerEvent) {
  emit('select-page');

  // Rejeição de Palma inteligente:
  // Se palmRejection ativo e a entrada for de touch quando caneta estiver por perto ou se a área de contato for de palma da mão
  if (props.palmRejection) {
    if (e.pointerType === 'touch') {
      // Ignora toques acidentais largos ou contato da mão
      if ((e.width && e.width > 25) || (e.height && e.height > 25)) {
        return;
      }
    }
  }

  // Detecção de Botão da caneta S-Pen / Stylus (botão lateral ou borracha):
  // e.buttons & 2: Botão lateral da S-Pen ou Wacom pressionado
  // e.buttons & 32 ou e.pointerType === 'eraser': Ponta traseira da borracha
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
  // Se estiver apagando com o botão da S-Pen ou ferramenta borracha
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

function handlePointerUp() {
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

// Exporta a página inteira combinando fundo e traços para PNG
function exportToDataUrl(): string {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  const exportCtx = exportCanvas.getContext('2d');
  if (!exportCtx) return '';

  // Fundo branco sólido para renderização ideal pela IA
  exportCtx.fillStyle = '#FFFFFF';
  exportCtx.fillRect(0, 0, width, height);

  // Renderiza o fundo sutil
  if (bgCanvasRef.value) {
    exportCtx.drawImage(bgCanvasRef.value, 0, 0);
  }

  // Renderiza os traços
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
});
</script>
