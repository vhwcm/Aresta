import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  extractLinesFromRects,
  calculateFocusWindow,
  useReaderFocus,
  type FocusLineRect,
} from '../../../app/composables/reader/useReaderFocus'
import { useReaderStore } from '../../../app/stores/readerStore'

describe('useReaderFocus & Focus Mode Engine', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('extractLinesFromRects', () => {
    it('retorna array vazio quando não há retângulos', () => {
      expect(extractLinesFromRects([])).toEqual([])
    })

    it('ignora retângulos com largura ou altura zero', () => {
      const rects = [
        { top: 10, bottom: 30, left: 10, right: 10, width: 0, height: 20 },
        { top: 10, bottom: 10, left: 10, right: 100, width: 90, height: 0 },
      ]
      expect(extractLinesFromRects(rects)).toEqual([])
    })

    it('agrupa palavras na mesma linha (mesmo top dentro da tolerância)', () => {
      const rects = [
        { top: 10, bottom: 28, left: 20, right: 80, width: 60, height: 18 },
        { top: 11, bottom: 29, left: 85, right: 150, width: 65, height: 18 },
        { top: 10, bottom: 28, left: 155, right: 220, width: 65, height: 18 },
      ]

      const lines = extractLinesFromRects(rects, 5)
      expect(lines.length).toBe(1)
      expect(lines[0]!.top).toBe(10)
      expect(lines[0]!.bottom).toBe(29)
      expect(lines[0]!.left).toBe(20)
      expect(lines[0]!.right).toBe(220)
      expect(lines[0]!.width).toBe(200)
    })

    it('separa múltiplas linhas com posições verticais distintas', () => {
      const rects = [
        // Linha 1
        { top: 10, bottom: 30, left: 20, right: 200, width: 180, height: 20 },
        // Linha 2
        { top: 40, bottom: 60, left: 20, right: 250, width: 230, height: 20 },
        // Linha 3
        { top: 70, bottom: 90, left: 20, right: 190, width: 170, height: 20 },
      ]

      const lines = extractLinesFromRects(rects, 5)
      expect(lines.length).toBe(3)
      expect(lines[0]!.top).toBe(10)
      expect(lines[1]!.top).toBe(40)
      expect(lines[2]!.top).toBe(70)
    })
  })

  describe('calculateFocusWindow', () => {
    const mockLines: FocusLineRect[] = [
      { top: 10, bottom: 30, left: 0, right: 300, height: 20, width: 300 },
      { top: 40, bottom: 60, left: 0, right: 300, height: 20, width: 300 },
      { top: 70, bottom: 90, left: 0, right: 300, height: 20, width: 300 },
      { top: 100, bottom: 120, left: 0, right: 300, height: 20, width: 300 },
      { top: 130, bottom: 150, left: 0, right: 300, height: 20, width: 300 },
      { top: 160, bottom: 180, left: 0, right: 300, height: 20, width: 300 },
      { top: 190, bottom: 210, left: 0, right: 300, height: 20, width: 300 },
    ]

    it('lida graciosamente com documento/página sem linhas extraídas', () => {
      const bounds = calculateFocusWindow([], 0, 3, 600)
      expect(bounds.totalLines).toBe(0)
      expect(bounds.isLastBlock).toBe(true)
      expect(bounds.height).toBe(600)
    })

    it('calcula corretamente o bloco de 3 linhas no topo da página', () => {
      const bounds = calculateFocusWindow(mockLines, 0, 3, 600)
      expect(bounds.startLine).toBe(0)
      expect(bounds.endLine).toBe(2)
      expect(bounds.top).toBe(10)
      expect(bounds.bottom).toBe(90)
      expect(bounds.height).toBe(80)
      expect(bounds.isLastBlock).toBe(false)
      expect(bounds.totalLines).toBe(7)
    })

    it('avança para o bloco intermediário de 3 linhas', () => {
      const bounds = calculateFocusWindow(mockLines, 3, 3, 600)
      expect(bounds.startLine).toBe(3)
      expect(bounds.endLine).toBe(5)
      expect(bounds.top).toBe(100)
      expect(bounds.bottom).toBe(180)
      expect(bounds.height).toBe(80)
      expect(bounds.isLastBlock).toBe(false)
    })

    it('edge case: se restarem menos de X linhas no final da página, exibe todas as restantes e marca isLastBlock', () => {
      // Total de linhas: 7. No índice 6 (última linha restante, que é 1 linha < 3 linhas)
      const bounds = calculateFocusWindow(mockLines, 6, 3, 600)
      expect(bounds.startLine).toBe(6)
      expect(bounds.endLine).toBe(6)
      expect(bounds.top).toBe(190)
      expect(bounds.bottom).toBe(210)
      expect(bounds.isLastBlock).toBe(true)
    })

    it('edge case: se restarem exatamente X linhas no final da página, marca isLastBlock', () => {
      // Total de linhas: 7. No índice 4 (linhas 4, 5, 6 = 3 linhas restantes)
      const bounds = calculateFocusWindow(mockLines, 4, 3, 600)
      expect(bounds.startLine).toBe(4)
      expect(bounds.endLine).toBe(6)
      expect(bounds.top).toBe(130)
      expect(bounds.bottom).toBe(210)
      expect(bounds.isLastBlock).toBe(true)
    })
  })

  describe('useReaderFocus composable & readerStore integration', () => {
    it('controla a ativação e desativação do Modo de Foco na store', () => {
      const store = useReaderStore()
      expect(store.isFocusMode).toBe(false)

      store.setFocusMode(true)
      expect(store.isFocusMode).toBe(true)
      expect(store.focusBlockIndex).toBe(0)

      store.setFocusLineCount(4)
      expect(store.focusLineCount).toBe(4)

      // Clamping de linhas entre 1 e 10
      store.setFocusLineCount(20)
      expect(store.focusLineCount).toBe(10)
      store.setFocusLineCount(0)
      expect(store.focusLineCount).toBe(1)

      store.toggleFocusMode()
      expect(store.isFocusMode).toBe(false)
    })

    it('avança blocos e dispara onNextPage quando atinge o último bloco', async () => {
      const store = useReaderStore()
      store.setFocusMode(true)
      store.setFocusLineCount(3)

      const onNextPageMock = vi.fn()
      const focus = useReaderFocus({
        onNextPage: onNextPageMock,
      })

      // Injeta 5 linhas mockadas
      ;(focus.lines as any).value = [
        { top: 0, bottom: 20, left: 0, right: 100, height: 20, width: 100 },
        { top: 25, bottom: 45, left: 0, right: 100, height: 20, width: 100 },
        { top: 50, bottom: 70, left: 0, right: 100, height: 20, width: 100 },
        { top: 75, bottom: 95, left: 0, right: 100, height: 20, width: 100 },
        { top: 100, bottom: 120, left: 0, right: 100, height: 20, width: 100 },
      ]

      // Bloco 1: Linhas 0, 1, 2 (3 linhas). Faltam 2 linhas (< 3)
      expect(focus.focusBounds.value.startLine).toBe(0)
      expect(focus.focusBounds.value.endLine).toBe(2)
      expect(focus.focusBounds.value.isLastBlock).toBe(false)
      expect(focus.progressLabel.value).toBe('Linhas 1-3 de 5')

      // Avança para Bloco 2: Linhas 3, 4 (2 linhas restantes)
      const res1 = await focus.nextBlock()
      expect(res1.transitionedPage).toBe(false)
      expect(store.focusBlockIndex).toBe(3)
      expect(focus.focusBounds.value.startLine).toBe(3)
      expect(focus.focusBounds.value.endLine).toBe(4)
      expect(focus.focusBounds.value.isLastBlock).toBe(true)
      expect(focus.progressLabel.value).toBe('Linhas 4-5 de 5')

      // Clique no último bloco -> Deve disparar virada de página e reiniciar no topo
      const res2 = await focus.nextBlock()
      expect(res2.transitionedPage).toBe(true)
      expect(onNextPageMock).toHaveBeenCalledTimes(1)
      expect(store.focusBlockIndex).toBe(0)
    })
  })
})
