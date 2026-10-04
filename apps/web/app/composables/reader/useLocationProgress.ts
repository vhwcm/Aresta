import { ref, computed, watch } from 'vue'
import { useReaderStore } from '~/stores/readerStore'
import type { TocEntry } from '~/utils/reader/toc/tocNormalizer'

export function useLocationProgress() {
  const store = useReaderStore()
  const cachedToc = ref<TocEntry[]>([])
  const currentChapter = ref<string | null>(null)

  const isEpub = computed(() => store.documentType === 'epub')

  const currentUnit = computed(() => {
    const doc = store.document as any
    if (doc && store.position && typeof doc.positionToUnit === 'function') {
      return doc.positionToUnit(store.position)
    }
    return Math.max(1, store.currentPage)
  })

  const totalUnits = computed(() => {
    const doc = store.document as any
    if (doc && typeof doc.getTotalUnits === 'function') {
      return doc.getTotalUnits()
    }
    return Math.max(1, store.totalPages)
  })

  const progressPercentage = computed(() => {
    if (totalUnits.value <= 0) return 0
    return Math.round((currentUnit.value / totalUnits.value) * 100)
  })

  const progressLabel = computed(() => {
    const cur = currentUnit.value.toLocaleString('pt-BR')
    const tot = totalUnits.value.toLocaleString('pt-BR')
    if (isEpub.value) {
      return `Loc. ${cur} de ${tot}`
    }
    return `Pág. ${cur} de ${tot}`
  })

  function findChapter(entries: TocEntry[], targetUnit: number): string | null {
    let candidate: string | null = null
    for (const entry of entries) {
      if (entry.unit <= targetUnit) {
        candidate = entry.label
        if (entry.children && entry.children.length > 0) {
          const childMatch = findChapter(entry.children, targetUnit)
          if (childMatch) candidate = childMatch
        }
      }
    }
    return candidate
  }

  watch(
    () => store.document,
    async (doc) => {
      if (!doc || typeof (doc as any).getToc !== 'function') {
        cachedToc.value = []
        currentChapter.value = null
        return
      }
      try {
        const toc = await (doc as any).getToc()
        cachedToc.value = toc || []
      } catch {
        cachedToc.value = []
      }
    },
    { immediate: true }
  )

  watch(
    [cachedToc, currentUnit],
    ([toc, unit]) => {
      if (!toc || toc.length === 0) {
        currentChapter.value = null
        return
      }
      currentChapter.value = findChapter(toc, unit)
    },
    { immediate: true }
  )

  return {
    isEpub,
    currentUnit,
    totalUnits,
    progressPercentage,
    progressLabel,
    currentChapter,
    cachedToc
  }
}
