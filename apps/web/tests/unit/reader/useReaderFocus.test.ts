import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  extractLinesFromRects,
  calculateFocusWindow,
  useReaderFocus,
  invalidateContainerLinesCache,
  extractLinesFromContainer,
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

      const lines = extractLinesFromRects(rects, 8)
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

      const lines = extractLinesFromRects(rects, 8)
      expect(lines.length).toBe(3)
      expect(lines[0]!.top).toBe(10)
      expect(lines[1]!.top).toBe(40)
      expect(lines[2]!.top).toBe(70)
    })

    it('suporta linhas dinâmicas de títulos altos ou blocos de imagem', () => {
      const rects = [
        // Título H1 alto (altura 48px)
        { top: 20, bottom: 68, left: 30, right: 350, width: 320, height: 48 },
        // Imagem/Figura (altura 180px)
        { top: 80, bottom: 260, left: 30, right: 400, width: 370, height: 180 },
        // Parágrafo de texto normal (altura 20px)
        { top: 280, bottom: 300, left: 30, right: 450, width: 420, height: 20 },
      ]

      const lines = extractLinesFromRects(rects, 8)
      expect(lines.length).toBe(3)
      expect(lines[0]!.height).toBe(48)
      expect(lines[1]!.height).toBe(180)
      expect(lines[2]!.height).toBe(20)
    })

    it('não agrupa retângulos verticais adjacentes quando a sobreposição vertical é insuficiente (< 35%)', () => {
      const rects = [
        { top: 10, bottom: 25, left: 10, right: 100, width: 90, height: 15 },
        { top: 22, bottom: 37, left: 110, right: 200, width: 90, height: 15 },
      ]
      // Sobreposição = 25 - 22 = 3px. Altura min = 15px. 3 / 15 = 20% < 35%
      const lines = extractLinesFromRects(rects, 12)
      expect(lines.length).toBe(2)
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

    it('calcula corretamente o bloco de 3 linhas no topo com margem de respiro vertical para acentos e letras', () => {
      const bounds = calculateFocusWindow(mockLines, 0, 3, 600)
      expect(bounds.startLine).toBe(0)
      expect(bounds.endLine).toBe(2)
      // Top 10 - 6px padding = 4px
      expect(bounds.top).toBe(4)
      // Bottom 90 + 6px padding = 96px
      expect(bounds.bottom).toBe(96)
      expect(bounds.height).toBe(92)
      expect(bounds.isLastBlock).toBe(false)
      expect(bounds.totalLines).toBe(7)
    })

    it('avança para o bloco intermediário de 3 linhas', () => {
      const bounds = calculateFocusWindow(mockLines, 3, 3, 600)
      expect(bounds.startLine).toBe(3)
      expect(bounds.endLine).toBe(5)
      expect(bounds.top).toBe(94)
      expect(bounds.bottom).toBe(186)
      expect(bounds.height).toBe(92)
      expect(bounds.isLastBlock).toBe(false)
    })

    it('edge case: se restarem menos de X linhas no final da página, exibe todas as restantes e marca isLastBlock', () => {
      // Total de linhas: 7. No índice 6 (última linha restante, que é 1 linha < 3 linhas)
      const bounds = calculateFocusWindow(mockLines, 6, 3, 600)
      expect(bounds.startLine).toBe(6)
      expect(bounds.endLine).toBe(6)
      expect(bounds.top).toBe(184)
      expect(bounds.bottom).toBe(216)
      expect(bounds.isLastBlock).toBe(true)
    })

    it('edge case: se restarem exatamente X linhas no final da página, marca isLastBlock', () => {
      // Total de linhas: 7. No índice 4 (linhas 4, 5, 6 = 3 linhas restantes)
      const bounds = calculateFocusWindow(mockLines, 4, 3, 600)
      expect(bounds.startLine).toBe(4)
      expect(bounds.endLine).toBe(6)
      expect(bounds.top).toBe(124)
      expect(bounds.bottom).toBe(216)
      expect(bounds.isLastBlock).toBe(true)
    })

    it('interrompe o bloco antes de espaçamento de parágrafo ou linha vazia (gap vertical > normal)', () => {
      const linesWithGap: FocusLineRect[] = [
        // Parágrafo 1 (2 linhas)
        { top: 10, bottom: 30, left: 0, right: 300, height: 20, width: 300 },
        { top: 40, bottom: 60, left: 0, right: 300, height: 20, width: 300 },
        // Linha vazia / Espaço de parágrafo de 40px (gap = 100 - 60 = 40px)
        // Parágrafo 2
        { top: 100, bottom: 120, left: 0, right: 300, height: 20, width: 300 },
        { top: 130, bottom: 150, left: 0, right: 300, height: 20, width: 300 },
      ]

      // Solicitado 3 linhas por bloco, começando no índice 0
      const bounds = calculateFocusWindow(linesWithGap, 0, 3, 600)
      // Deve parar na linha 1 (2 linhas no bloco) para não engolir o espaço vazio nem cortar o parágrafo seguinte
      expect(bounds.startLine).toBe(0)
      expect(bounds.endLine).toBe(1)
      expect(bounds.top).toBe(4) // 10 - 6px padding
      expect(bounds.bottom).toBe(66) // 60 + 6px padding
      expect(bounds.isLastBlock).toBe(false)

      // No próximo avanço (índice 2), deve focar perfeitamente no Parágrafo 2
      const nextBounds = calculateFocusWindow(linesWithGap, bounds.endLine + 1, 3, 600)
      expect(nextBounds.startLine).toBe(2)
      expect(nextBounds.endLine).toBe(3)
      expect(nextBounds.top).toBe(94) // 100 - 6px padding
      expect(nextBounds.bottom).toBe(156) // 150 + 6px padding
      expect(nextBounds.isLastBlock).toBe(true)
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

  describe('invalidateContainerLinesCache & container cache', () => {
    it('invalida cache ao chamar invalidateContainerLinesCache', () => {
      const container = document.createElement('div')
      const span1 = document.createElement('span')
      span1.textContent = 'Linha 1'
      span1.setAttribute('role', 'presentation')
      container.appendChild(span1)

      span1.getBoundingClientRect = () => ({
        top: 20,
        bottom: 40,
        left: 10,
        right: 200,
        width: 190,
        height: 20,
      } as DOMRect)
      container.getBoundingClientRect = () => ({
        top: 0,
        bottom: 500,
        left: 0,
        right: 500,
        width: 500,
        height: 500,
      } as DOMRect)

      const lines1 = extractLinesFromContainer(container)
      expect(lines1.length).toBe(1)
      expect(lines1[0]?.top).toBe(20)

      // Atualiza coordenadas do mock
      span1.getBoundingClientRect = () => ({
        top: 50,
        bottom: 80,
        left: 10,
        right: 200,
        width: 190,
        height: 30,
      } as DOMRect)

      // Com cache mantido, ainda retornaria o valor em cache (top 20)
      const cached = extractLinesFromContainer(container)
      expect(cached[0]?.top).toBe(20)

      // Ao invalidar explicitamente o container
      invalidateContainerLinesCache(container)
      const fresh = extractLinesFromContainer(container)
      expect(fresh[0]?.top).toBe(50)
    })

    it('invalida cache automaticamente ao detectar alteração de texto no container', () => {
      const container = document.createElement('div')
      const span = document.createElement('span')
      span.textContent = 'Texto da Página 1'
      span.setAttribute('role', 'presentation')
      container.appendChild(span)

      span.getBoundingClientRect = () => ({
        top: 10,
        bottom: 30,
        left: 10,
        right: 200,
        width: 190,
        height: 20,
      } as DOMRect)
      container.getBoundingClientRect = () => ({
        top: 0,
        bottom: 500,
        left: 0,
        right: 500,
        width: 500,
        height: 500,
      } as DOMRect)

      const lines1 = extractLinesFromContainer(container)
      expect(lines1.length).toBe(1)
      expect(lines1[0]?.top).toBe(10)

      // Modifica o texto do span (simulando renderPageToElement na mesma camada de texto persistente)
      span.textContent = 'Texto completamente novo da Página 2'
      span.getBoundingClientRect = () => ({
        top: 60,
        bottom: 85,
        left: 10,
        right: 200,
        width: 190,
        height: 25,
      } as DOMRect)

      const lines2 = extractLinesFromContainer(container)
      expect(lines2.length).toBe(1)
      expect(lines2[0]?.top).toBe(60)
    })
  })
})
