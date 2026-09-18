import { ref, type Ref } from 'vue'
import { useReaderStore } from '~/stores/readerStore'

export interface PageSlotRect {
  pageNumber: number
  top: number
  bottom: number
}

export interface UseReaderScrollOptions {
  containerRef: Ref<HTMLElement | null>
  totalPages: Ref<number>
}

/**
 * Determina qual página cruza o terço superior da viewport (baseline).
 */
export function determineActivePageFromSlots(slots: PageSlotRect[], baselineY = 200): number {
  if (!slots.length) return 1

  for (const slot of slots) {
    if (slot.top <= baselineY && slot.bottom > baselineY) {
      return slot.pageNumber
    }
  }

  // Fallback: se nenhum cruzar a baseline exata, encontra o mais próximo da baseline
  let closestPage = slots[0]!.pageNumber
  let minDistance = Infinity

  for (const slot of slots) {
    const distance = Math.abs(slot.top - baselineY)
    if (distance < minDistance) {
      minDistance = distance
      closestPage = slot.pageNumber
    }
  }

  return closestPage
}

export function useReaderScroll({ containerRef, totalPages }: UseReaderScrollOptions) {
  const store = useReaderStore()
  const activePage = ref<number>(store.currentPage || 1)
  const isScrollingProgrammatically = ref<boolean>(false)
  let programmaticTimer: ReturnType<typeof setTimeout> | null = null

  function onPageVisible(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > totalPages.value) return
    activePage.value = pageNumber

    if (!isScrollingProgrammatically.value) {
      store.currentPage = pageNumber
    }
  }

  function scrollToPage(pageNumber: number, behavior: ScrollBehavior = 'smooth') {
    const container = containerRef.value
    if (!container) return

    const clampedPage = Math.max(1, Math.min(totalPages.value, pageNumber))
    const targetElement = container.querySelector(`[data-page-number="${clampedPage}"]`) as HTMLElement | null

    isScrollingProgrammatically.value = true
    if (programmaticTimer) clearTimeout(programmaticTimer)

    if (targetElement) {
      // Calcula posição relativa ao topo do container
      const containerRect = container.getBoundingClientRect()
      const targetRect = targetElement.getBoundingClientRect()
      const relativeTop = targetRect.top - containerRect.top + container.scrollTop

      container.scrollTo({
        top: Math.max(0, relativeTop - 16),
        behavior,
      })
    } else {
      // Fallback proporcional se o elemento ainda não estiver montado
      const scrollRatio = (clampedPage - 1) / Math.max(1, totalPages.value)
      const targetScroll = scrollRatio * container.scrollHeight
      container.scrollTo({
        top: targetScroll,
        behavior,
      })
    }

    activePage.value = clampedPage
    store.currentPage = clampedPage

    programmaticTimer = setTimeout(() => {
      isScrollingProgrammatically.value = false
    }, 600)
  }

  function handleKeyDown(e: KeyboardEvent): boolean {
    const container = containerRef.value
    if (!container) return false

    // Se estiver em um campo de texto, não intercepta
    const activeEl = document.activeElement
    if (
      activeEl &&
      (activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement).isContentEditable)
    ) {
      return false
    }

    const clientHeight = container.clientHeight || 800
    const scrollAmount = Math.round(clientHeight * 0.8)

    switch (e.key) {
      case 'PageDown':
      case ' ': {
        if (e.key === ' ' && e.shiftKey) {
          e.preventDefault()
          container.scrollTo({
            top: Math.max(0, container.scrollTop - scrollAmount),
            behavior: 'smooth',
          })
          return true
        }
        e.preventDefault()
        container.scrollTo({
          top: container.scrollTop + scrollAmount,
          behavior: 'smooth',
        })
        return true
      }
      case 'PageUp': {
        e.preventDefault()
        container.scrollTo({
          top: Math.max(0, container.scrollTop - scrollAmount),
          behavior: 'smooth',
        })
        return true
      }
      case 'ArrowDown': {
        e.preventDefault()
        container.scrollTo({
          top: container.scrollTop + 60,
          behavior: 'smooth',
        })
        return true
      }
      case 'ArrowUp': {
        e.preventDefault()
        container.scrollTo({
          top: Math.max(0, container.scrollTop - 60),
          behavior: 'smooth',
        })
        return true
      }
      case 'Home': {
        e.preventDefault()
        container.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
        return true
      }
      case 'End': {
        e.preventDefault()
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        })
        return true
      }
      default:
        return false
    }
  }

  return {
    activePage,
    isScrollingProgrammatically,
    onPageVisible,
    scrollToPage,
    handleKeyDown,
    determineActivePageFromSlots,
  }
}
