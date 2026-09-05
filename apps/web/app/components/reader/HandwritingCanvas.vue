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
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer"
          title="Caneta"
          aria-label="Ferramenta Caneta"
        >
          <PenToolIcon class="w-3.5 h-3.5" />
          <span>Caneta</span>
        </button>
        <button
          type="button"
          @click="activeTool = 'eraser'"
          :class="activeTool === 'eraser' ? 'bg-accent text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-white/5'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer"
          title="Borracha"
          aria-label="Ferramenta Borracha"
        >
          <EraserIcon class="w-3.5 h-3.5" />
          <span>Borracha</span>
        </button>
      </div>

      <!-- Cores da Caneta -->
      <div v-if="activeTool === 'pen'" class="flex items-center gap-1 bg-bgApp/60 px-2 py-1 rounded-lg border border-divider/60">
        <span class="text-[11px] text-textSecondary font-medium mr-0.5 hidden sm:inline">Cor:</span>
        <button
          v-for="c in colorOptions"
          :key="c.id"
          type="button"
          @click="selectedColor = c.id"
          :class="selectedColor === c.id ? 'ring-2 ring-accent scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'"
          class="w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer border border-divider"
          :title="c.label"
          :aria-label="`Cor ${c.label}`"
        >
          <span
            class="w-3.5 h-3.5 rounded-full"
            :style="{ backgroundColor: getDisplayColor(c.id) }"
          ></span>
        </button>
      </div>

      <!-- Espessura da Caneta -->
      <div v-if="activeTool === 'pen'" class="flex items-center gap-1.5 bg-bgApp/60 px-2 py-1 rounded-lg border border-divider/60">
        <span class="text-[11px] text-textSecondary font-medium mr-1 hidden sm:inline">Espessura:</span>
        <button
          v-for="size in strokeSizes"
          :key="size.id"
          type="button"
          @click="selectedSize = size.id"
          :class="selectedSize === size.id ? 'bg-white/20 border-accent text-accent' : 'text-textSecondary hover:text-textPrimary border-transparent'"
          class="w-6 h-6 rounded-md flex items-center justify-center border transition-all cursor-pointer"
          :title="size.label"
          :aria-label="`Espessura ${size.label}`"
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
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-divider/60 text-textSecondary hover:text-textPrimary hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Desfazer traço"
          aria-label="Desfazer último traço"
        >
          <Undo2Icon class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Desfazer</span>
        </button>
        <button
          type="button"
          @click="handleClear"
          :disabled="!hasStrokes"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Limpar tela"
          aria-label="Limpar tela de desenho"
        >
          <Trash2Icon class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Limpar</span>
        </button>
      </div>
    </div>

    <!-- Área de Desenho (Canvas Container) -->
    <div
      ref="containerRef"
      class="relative flex-1 w-full min-h-[260px] bg-bgApp border border-divider rounded-2xl overflow-hidden shadow-inner touch-none cursor-crosshair flex items-center justify-center"
    >
      <!-- Grid pontilhado suave de caderno/sketchbook -->
      <div
        class="absolute inset-0 pointer-events-none opacity-15"
        style="background-image: radial-gradient(circle, currentColor 1px, transparent 1px); background-size: 20px 20px;"
      ></div>

      <!-- Placeholder quando vazio -->
      <div
        v-if="!hasStrokes"
        class="absolute pointer-events-none flex flex-col items-center justify-center text-center p-4 text-textSecondary/50 select-none z-0"
      >
        <PencilIcon class="w-8 h-8 mb-2 opacity-60 stroke-[1.5]" />
        <p class="text-xs font-medium">Escreva ou desenhe aqui com mouse, touch ou stylus</p>
        <p class="text-[11px] opacity-75">O OCR transcreverá sua caligrafia automaticamente ao salvar</p>
      </div>

      <canvas
        ref="canvasRef"
        class="relative block w-full h-full z-10"
        @pointerdown="startDrawing"
        @pointermove="draw"
        @pointerup="stopDrawing"
        @pointercancel="stopDrawing"
        @pointerleave="stopDrawing"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
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
const selectedColor = ref<string>('auto')
const hasStrokes = ref(false)

const colorOptions = [
  { id: 'auto', label: 'Automático / Contraste' },
  { id: '#E57B55', label: 'Laranja Aresta' },
  { id: '#3B82F6', label: 'Azul' },
  { id: '#10B981', label: 'Verde' },
  { id: '#8B5CF6', label: 'Roxo' },
]

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
let resizeObserver: ResizeObserver | null = null

// Pilha de estados para Undo (armazenamos ImageData)
const historyStack = ref<ImageData[]>([])
const MAX_HISTORY = 20

const isDarkMode = (): boolean => {
  if (typeof document === 'undefined') return false
  const root = document.documentElement
  const body = document.body
  return (
    root.classList.contains('dark-theme') ||
    root.getAttribute('data-theme') === 'dark' ||
    Boolean(body?.classList.contains('dark-theme'))
  )
}

const getDisplayColor = (colorId: string): string => {
  if (colorId === 'auto') {
    return isDarkMode() ? '#F2F2F2' : '#18191B'
  }
  return colorId
}

const getStrokeColor = (): string => {
  if (selectedColor.value === 'auto') {
    return isDarkMode() ? '#F2F2F2' : '#18191B'
  }
  return selectedColor.value
}

const getStrokeWidth = (): number => {
  if (activeTool.value === 'eraser') return 24
  const found = strokeSizes.find((s) => s.id === selectedSize.value)
  return found ? found.width : 4.5
}

const saveState = () => {
  if (!ctx || !canvasRef.value) return
  try {
    const imgData = ctx.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
    historyStack.value.push(imgData)
    if (historyStack.value.length > MAX_HISTORY) {
      historyStack.value.shift()
    }
  } catch {
    // ignore in environments where getImageData is restricted
  }
}

const initCanvas = () => {
  if (!canvasRef.value || !containerRef.value) return
  const canvas = canvasRef.value
  const container = containerRef.value

  const rect = container.getBoundingClientRect()
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1

  const width = Math.max(Math.floor(rect.width), 300)
  const height = Math.max(Math.floor(rect.height), 260)

  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)

  ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(dpr, dpr)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (historyStack.value.length === 0) {
    saveState()
  }
}

const handleResize = () => {
  if (!canvasRef.value || !containerRef.value) return
  if (!ctx) {
    initCanvas()
    return
  }

  const canvas = canvasRef.value
  const container = containerRef.value
  const rect = container.getBoundingClientRect()
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1

  const newWidth = Math.floor(Math.max(rect.width, 300) * dpr)
  const newHeight = Math.floor(Math.max(rect.height, 260) * dpr)

  if (canvas.width === newWidth && canvas.height === newHeight) {
    return
  }

  // Preserva os traços existentes antes de redimensionar
  let tempCanvas: HTMLCanvasElement | null = null
  let tempCtx: CanvasRenderingContext2D | null = null
  if (canvas.width > 0 && canvas.height > 0) {
    tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    tempCtx = tempCanvas.getContext('2d')
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0)
    }
  }

  canvas.width = newWidth
  canvas.height = newHeight
  ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(dpr, dpr)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (tempCanvas && tempCtx && tempCanvas.width > 0 && tempCanvas.height > 0) {
    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width / dpr, tempCanvas.height / dpr)
    saveState()
  }
}

const getPointerPos = (e: MouseEvent | PointerEvent) => {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}

const startDrawing = (e: MouseEvent | PointerEvent) => {
  if (!ctx || !canvasRef.value || canvasRef.value.width === 0) {
    initCanvas()
  }
  if (!ctx || !canvasRef.value) return

  isDrawing = true
  if ('pointerId' in e && canvasRef.value.setPointerCapture) {
    try {
      canvasRef.value.setPointerCapture((e as PointerEvent).pointerId)
    } catch {
      // ignore
    }
  }

  const pos = getPointerPos(e)
  lastX = pos.x
  lastY = pos.y

  const strokeColor = getStrokeColor()
  const strokeWidth = getStrokeWidth()

  ctx.beginPath()
  ctx.arc(lastX, lastY, strokeWidth / 2, 0, Math.PI * 2)
  if (activeTool.value === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = strokeColor
  }
  ctx.fill()
  hasStrokes.value = true
}

const draw = (e: MouseEvent | PointerEvent) => {
  if (!isDrawing) return
  if (!ctx || !canvasRef.value) {
    initCanvas()
    if (!ctx) return
  }

  // Se mouse não estiver pressionado em evento de mouse
  if ('buttons' in e && e.buttons === 0 && (!('pointerType' in e) || (e as PointerEvent).pointerType === 'mouse')) {
    stopDrawing(e)
    return
  }

  const pos = getPointerPos(e)
  const strokeColor = getStrokeColor()
  const strokeWidth = getStrokeWidth()

  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(pos.x, pos.y)

  ctx.lineWidth = strokeWidth
  if (activeTool.value === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = strokeColor
  }

  ctx.stroke()
  lastX = pos.x
  lastY = pos.y
  hasStrokes.value = true
}

const stopDrawing = (e?: MouseEvent | PointerEvent) => {
  if (!isDrawing) return
  isDrawing = false
  if (e && 'pointerId' in e && canvasRef.value && canvasRef.value.releasePointerCapture) {
    try {
      canvasRef.value.releasePointerCapture((e as PointerEvent).pointerId)
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
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.putImageData(previousState, 0, 0)
    ctx.restore()
    hasStrokes.value = historyStack.value.length > 1
  }
}

const handleClear = () => {
  if (!ctx || !canvasRef.value) return
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  ctx.restore()
  hasStrokes.value = false
  historyStack.value = []
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

  const srcCtx = srcCanvas.getContext('2d')
  if (!srcCtx) {
    return { base64: '', isEmpty: true }
  }

  try {
    const srcImgData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height)
    const srcData = srcImgData.data

    const outImgData = outCtx.createImageData(outCanvas.width, outCanvas.height)
    const outData = outImgData.data

    let drawnPixels = 0

    for (let i = 0; i < srcData.length; i += 4) {
      const alpha = srcData[i + 3]

      if ((alpha ?? 0) > 20) {
        // Traço desenhado pelo usuário -> preto sólido com fundo branco
        outData[i] = 0
        outData[i + 1] = 0
        outData[i + 2] = 0
        outData[i + 3] = 255
        drawnPixels++
      } else {
        // Fundo em branco sólido
        outData[i] = 255
        outData[i + 1] = 255
        outData[i + 2] = 255
        outData[i + 3] = 255
      }
    }

    if (drawnPixels < 15) {
      return { base64: '', isEmpty: true }
    }

    outCtx.putImageData(outImgData, 0, 0)
    const base64 = outCanvas.toDataURL('image/png')
    return { base64, isEmpty: false }
  } catch {
    // Fallback caso getImageData não esteja disponível
    outCtx.fillStyle = '#FFFFFF'
    outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height)
    outCtx.drawImage(srcCanvas, 0, 0)
    return { base64: outCanvas.toDataURL('image/png'), isEmpty: false }
  }
}

defineExpose({
  exportForOcr,
  clearCanvas: handleClear,
  hasStrokes,
  activeTool,
  selectedColor,
  selectedSize,
  startDrawing,
  draw,
  stopDrawing,
  getStrokeColor,
})

onMounted(() => {
  void nextTick(() => {
    initCanvas()
    if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        handleResize()
      })
      resizeObserver.observe(containerRef.value)
    }
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

