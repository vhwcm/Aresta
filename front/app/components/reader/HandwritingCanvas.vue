<template>
  <div class="flex flex-col h-full w-full select-none">
    <!-- Toolbar de Ferramentas -->
    <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-bgPanel/80 border border-divider rounded-xl mb-3 backdrop-blur-sm">
      <!-- Seletor de Ferramenta (Caneta vs Borracha) -->
      <div class="flex items-center gap-1 bg-bgApp/60 p-1 rounded-lg border border-divider/60">
        <button
          type="button"
          @click="activeTool = 'pen'"
          :class="activeTool === 'pen' ? 'bg-accent text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-white/5'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
          title="Caneta"
        >
          <PenToolIcon class="w-3.5 h-3.5" />
          <span>Caneta</span>
        </button>
        <button
          type="button"
          @click="activeTool = 'eraser'"
          :class="activeTool === 'eraser' ? 'bg-accent text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-white/5'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
          title="Borracha"
        >
          <EraserIcon class="w-3.5 h-3.5" />
          <span>Borracha</span>
        </button>
      </div>

      <!-- Espessura da Caneta -->
      <div v-if="activeTool === 'pen'" class="flex items-center gap-1.5 bg-bgApp/60 px-2 py-1 rounded-lg border border-divider/60">
        <span class="text-[11px] text-textSecondary font-medium mr-1">Espessura:</span>
        <button
          v-for="size in strokeSizes"
          :key="size.id"
          type="button"
          @click="selectedSize = size.id"
          :class="selectedSize === size.id ? 'bg-white/20 border-accent text-accent' : 'text-textSecondary hover:text-textPrimary border-transparent'"
          class="w-6 h-6 rounded-md flex items-center justify-center border transition-all"
          :title="size.label"
        >
          <span
            class="rounded-full bg-current"
            :style="{ width: `${size.dot}px`, height: `${size.dot}px` }"
          ></span>
        </button>
      </div>

      <!-- Ações: Desfazer e Limpar -->
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          @click="handleUndo"
          :disabled="historyStack.length <= 1"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-divider/60 text-textSecondary hover:text-textPrimary hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Desfazer traço"
        >
          <Undo2Icon class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Desfazer</span>
        </button>
        <button
          type="button"
          @click="handleClear"
          :disabled="!hasStrokes"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Limpar tela"
        >
          <Trash2Icon class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Limpar</span>
        </button>
      </div>
    </div>

    <!-- Área de Desenho (Canvas Container) -->
    <div
      ref="containerRef"
      class="relative flex-1 w-full min-h-[260px] bg-bgApp/90 border border-divider rounded-2xl overflow-hidden shadow-inner touch-none cursor-crosshair flex items-center justify-center"
    >
      <!-- Grid pontilhado suave de caderno/sketchbook -->
      <div
        class="absolute inset-0 pointer-events-none opacity-15"
        style="background-image: radial-gradient(circle, currentColor 1px, transparent 1px); background-size: 20px 20px;"
      ></div>

      <!-- Placeholder quando vazio -->
      <div
        v-if="!hasStrokes"
        class="absolute pointer-events-none flex flex-col items-center justify-center text-center p-4 text-textSecondary/40"
      >
        <PencilIcon class="w-8 h-8 mb-2 opacity-50 stroke-[1.5]" />
        <p class="text-xs font-medium">Escreva ou desenhe aqui com mouse, touch ou stylus</p>
        <p class="text-[11px] opacity-70">O OCR transcreverá sua caligrafia automaticamente ao salvar</p>
      </div>

      <canvas
        ref="canvasRef"
        class="block w-full h-full"
        @pointerdown="startDrawing"
        @pointermove="draw"
        @pointerup="stopDrawing"
        @pointercancel="stopDrawing"
        @pointerleave="stopDrawing"
      ></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import {
  PenToolIcon,
  EraserIcon,
  Undo2Icon,
  Trash2Icon,
  PencilIcon,
} from 'lucide-vue-next'

type ToolType = 'pen' | 'eraser'
type SizeType = 'fine' | 'medium' | 'thick'

const activeTool = ref<ToolType>('pen')
const selectedSize = ref<SizeType>('medium')
const hasStrokes = ref(false)

const strokeSizes = [
  { id: 'fine' as SizeType, label: 'Fina', width: 2.5, dot: 4 },
  { id: 'medium' as SizeType, label: 'Média', width: 4.5, dot: 7 },
  { id: 'thick' as SizeType, label: 'Grossa', width: 8.0, dot: 11 },
]

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let ctx: CanvasRenderingContext2D | null = null
let isDrawing = false
let lastX = 0
let lastY = 0

// Pilha de estados para Undo (armazenamos ImageData)
const historyStack = ref<ImageData[]>([])
const MAX_HISTORY = 20

const getStrokeWidth = (): number => {
  if (activeTool.value === 'eraser') return 24
  const found = strokeSizes.find((s) => s.id === selectedSize.value)
  return found ? found.width : 4.5
}

const saveState = () => {
  if (!ctx || !canvasRef.value) return
  const imgData = ctx.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
  historyStack.value.push(imgData)
  if (historyStack.value.length > MAX_HISTORY) {
    historyStack.value.shift()
  }
}

const initCanvas = () => {
  if (!canvasRef.value || !containerRef.value) return
  const canvas = canvasRef.value
  const container = containerRef.value

  const rect = container.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1

  canvas.width = Math.floor(rect.width * dpr)
  canvas.height = Math.floor(rect.height * dpr)

  ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(dpr, dpr)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Salva estado inicial em branco
  historyStack.value = []
  saveState()
}

const handleResize = () => {
  if (!canvasRef.value || !containerRef.value || !ctx) return
  // Se já tiver traços, redimensiona preservando o desenho
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvasRef.value.width
  tempCanvas.height = canvasRef.value.height
  const tempCtx = tempCanvas.getContext('2d')
  if (tempCtx) {
    tempCtx.drawImage(canvasRef.value, 0, 0)
  }

  initCanvas()

  if (tempCtx && ctx) {
    ctx.drawImage(tempCanvas, 0, 0)
    saveState()
  }
}

const getPointerPos = (e: PointerEvent) => {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}

const startDrawing = (e: PointerEvent) => {
  if (!ctx || !canvasRef.value) return
  isDrawing = true
  canvasRef.value.setPointerCapture(e.pointerId)
  const pos = getPointerPos(e)
  lastX = pos.x
  lastY = pos.y

  // Desenha um ponto no local do clique inicial
  ctx.beginPath()
  ctx.arc(lastX, lastY, getStrokeWidth() / 2, 0, Math.PI * 2)
  if (activeTool.value === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#FFFFFF'
  }
  ctx.fill()
}

const draw = (e: PointerEvent) => {
  if (!isDrawing || !ctx) return
  const pos = getPointerPos(e)

  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(pos.x, pos.y)

  ctx.lineWidth = getStrokeWidth()
  if (activeTool.value === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = '#FFFFFF'
  }

  ctx.stroke()
  lastX = pos.x
  lastY = pos.y
  hasStrokes.value = true
}

const stopDrawing = (e: PointerEvent) => {
  if (!isDrawing) return
  isDrawing = false
  if (canvasRef.value && e.pointerId) {
    try {
      canvasRef.value.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }
  saveState()
}

const handleUndo = () => {
  if (!ctx || !canvasRef.value || historyStack.value.length <= 1) return
  historyStack.value.pop() // Remove o estado atual
  const previousState = historyStack.value[historyStack.value.length - 1]
  if (previousState) {
    ctx.putImageData(previousState, 0, 0)
    hasStrokes.value = historyStack.value.length > 1
  }
}

const handleClear = () => {
  if (!ctx || !canvasRef.value) return
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  hasStrokes.value = false
  saveState()
}

/**
 * Exporta os traços desenhados como imagem Base64 PNG com fundo branco e traços pretos (otimizada para OCR de alta precisão).
 */
const exportForOcr = (): { base64: string; isEmpty: boolean } => {
  if (!canvasRef.value || !hasStrokes.value) {
    return { base64: '', isEmpty: true }
  }

  const srcCanvas = canvasRef.value
  const outCanvas = document.createElement('canvas')
  outCanvas.width = srcCanvas.width
  outCanvas.height = srcCanvas.height

  const outCtx = outCanvas.getContext('2d')
  if (!outCtx) {
    return { base64: '', isEmpty: true }
  }

  // 1. Pinta fundo branco sólido
  outCtx.fillStyle = '#FFFFFF'
  outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height)

  // 2. Converte os traços brancos da UI para traços escuros/pretos para o Gemini OCR
  outCtx.globalCompositeOperation = 'source-over'
  outCtx.drawImage(srcCanvas, 0, 0)

  // Inverte traços para preto sobre branco
  const imgData = outCtx.getImageData(0, 0, outCanvas.width, outCanvas.height)
  const data = imgData.data
  let nonWhitePixels = 0

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // Se houver traço branco desenhado na imagem original
    if (r > 150 && g > 150 && b > 150) {
      // Torna preto puro
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 255
      nonWhitePixels++
    }
  }

  if (nonWhitePixels < 20) {
    return { base64: '', isEmpty: true }
  }

  outCtx.putImageData(imgData, 0, 0)
  const base64 = outCanvas.toDataURL('image/png')
  return { base64, isEmpty: false }
}

defineExpose({
  exportForOcr,
  clearCanvas: handleClear,
  hasStrokes,
})

onMounted(() => {
  void nextTick(() => {
    initCanvas()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
