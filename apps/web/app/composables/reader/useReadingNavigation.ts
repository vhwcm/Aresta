import { ref, computed } from 'vue'
import { useReaderStore } from '~/stores/readerStore'
import { type ReadingPosition, parsePosition, serializePosition } from '~/utils/reader/position/readingPosition'

export function parseGoToInput(
  input: string,
  totalUnits: number,
  docType: 'epub' | 'pdf' | 'didactic' = 'epub',
  document?: any
): ReadingPosition | null {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  // 1. Posição canônica serializada (ex: epub:2:100 ou page:10)
  if (trimmed.startsWith('epub:') || trimmed.startsWith('page:')) {
    const pos = parsePosition(trimmed)
    if (!pos || pos.kind === 'legacy-page') return null
    return pos
  }

  // 2. Porcentagem (ex: "37%" ou "37.5 %")
  const pctMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*%$/)
  if (pctMatch && pctMatch[1]) {
    const pct = parseFloat(pctMatch[1])
    if (isNaN(pct) || pct < 0 || pct > 100) return null
    const safeTotal = Math.max(1, totalUnits)
    const unit = Math.max(1, Math.min(safeTotal, Math.round((pct / 100) * safeTotal)))
    if (document && typeof document.unitToPosition === 'function') {
      return document.unitToPosition(unit)
    }
    if (docType === 'pdf') {
      return { kind: 'pdf', page: unit }
    }
    return { kind: 'epub', sectionIndex: Math.max(0, unit - 1), charOffset: 0 }
  }

  // 3. Notação de localização (ex: "Loc 1200", "loc 1200", "Loc. 1200", "L 1200", "loc:1200")
  const locMatch = trimmed.match(/^(?:loc(?:al(?:iza[çc][ãa]o)?)?\.?|l)\s*:?\s*(\d+)$/i)
  if (locMatch && locMatch[1]) {
    const loc = parseInt(locMatch[1], 10)
    if (isNaN(loc)) return null
    const safeTotal = Math.max(1, totalUnits)
    const unit = Math.max(1, Math.min(safeTotal, loc))
    if (document && typeof document.unitToPosition === 'function') {
      return document.unitToPosition(unit)
    }
    return { kind: 'epub', sectionIndex: Math.max(0, unit - 1), charOffset: 0 }
  }

  // 4. Número simples (ex: "42")
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10)
    if (isNaN(num)) return null
    const safeTotal = Math.max(1, totalUnits)
    const unit = Math.max(1, Math.min(safeTotal, num))
    if (document && typeof document.unitToPosition === 'function') {
      return document.unitToPosition(unit)
    }
    if (docType === 'pdf') {
      return { kind: 'pdf', page: unit }
    }
    return { kind: 'epub', sectionIndex: Math.max(0, unit - 1), charOffset: 0 }
  }

  return null
}

const historyStack = ref<ReadingPosition[]>([])
const showBackChip = ref(false)
let backChipTimer: any = null

export function useReadingNavigation() {
  const store = useReaderStore()

  const canGoBack = computed(() => historyStack.value.length > 0)

  function triggerBackChip() {
    showBackChip.value = true
    if (backChipTimer) {
      clearTimeout(backChipTimer)
    }
    backChipTimer = setTimeout(() => {
      showBackChip.value = false
      backChipTimer = null
    }, 6000)
  }

  function dismissBackChip() {
    showBackChip.value = false
    if (backChipTimer) {
      clearTimeout(backChipTimer)
      backChipTimer = null
    }
  }

  function goToPosition(pos: ReadingPosition, options?: { pushHistory?: boolean }) {
    if (options?.pushHistory !== false && store.position) {
      if (serializePosition(store.position) !== serializePosition(pos)) {
        historyStack.value.push({ ...store.position })
        triggerBackChip()
      }
    }
    store.goToPosition(pos)
  }

  function goBack() {
    if (historyStack.value.length === 0) return
    const prevPos = historyStack.value.pop()!
    dismissBackChip()
    goToPosition(prevPos, { pushHistory: false })
  }

  function clearHistory() {
    historyStack.value = []
    dismissBackChip()
  }

  return {
    historyStack,
    canGoBack,
    showBackChip,
    goToPosition,
    goBack,
    triggerBackChip,
    dismissBackChip,
    clearHistory,
    parseGoToInput: (input: string) => {
      const docType = store.documentType || 'epub'
      const totalUnits = store.totalPages || 1
      return parseGoToInput(input, totalUnits, docType, store.document)
    }
  }
}
