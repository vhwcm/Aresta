import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReaderStore } from '../../../app/stores/readerStore'
import { parseGoToInput, useReadingNavigation } from '../../../app/composables/reader/useReadingNavigation'
import { resolveLegacyPosition } from '../../../app/utils/reader/position/legacyPositionResolver'
import { createExactIndex } from '../../../app/utils/reader/position/locationIndex'

describe('parseGoToInput', () => {
  it('1. Deve interpretar posições canônicas serializadas', () => {
    const posEpub = parseGoToInput('epub:3:150', 500, 'epub')
    expect(posEpub).toEqual({ kind: 'epub', sectionIndex: 3, charOffset: 150 })

    const posPdf = parseGoToInput('page:12', 50, 'pdf')
    expect(posPdf).toEqual({ kind: 'pdf', page: 12 })
  })

  it('2. Deve interpretar porcentagens e converter para unidades', () => {
    const pos50 = parseGoToInput('50%', 100, 'pdf')
    expect(pos50).toEqual({ kind: 'pdf', page: 50 })

    const pos0 = parseGoToInput('0%', 100, 'pdf')
    expect(pos0).toEqual({ kind: 'pdf', page: 1 }) // Clamped to 1

    const pos100 = parseGoToInput('100%', 100, 'pdf')
    expect(pos100).toEqual({ kind: 'pdf', page: 100 })

    // Porcentagem inválida
    expect(parseGoToInput('150%', 100, 'pdf')).toBeNull()
    expect(parseGoToInput('-10%', 100, 'pdf')).toBeNull()
  })

  it('3. Deve interpretar variações de Loc / Localização', () => {
    const pos1 = parseGoToInput('Loc 500', 1000, 'epub')
    expect(pos1).toEqual({ kind: 'epub', sectionIndex: 499, charOffset: 0 })

    const pos2 = parseGoToInput('loc. 200', 1000, 'epub')
    expect(pos2).toEqual({ kind: 'epub', sectionIndex: 199, charOffset: 0 })

    const pos3 = parseGoToInput('L 50', 1000, 'epub')
    expect(pos3).toEqual({ kind: 'epub', sectionIndex: 49, charOffset: 0 })
  })

  it('4. Deve interpretar números simples', () => {
    const posPdf = parseGoToInput('25', 100, 'pdf')
    expect(posPdf).toEqual({ kind: 'pdf', page: 25 })

    // Número acima do total deve ser limitado ao total
    const posClamped = parseGoToInput('200', 100, 'pdf')
    expect(posClamped).toEqual({ kind: 'pdf', page: 100 })

    // Entrada inválida
    expect(parseGoToInput('abc', 100, 'pdf')).toBeNull()
    expect(parseGoToInput('', 100, 'pdf')).toBeNull()
  })
})

describe('useReadingNavigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('1. Deve manter pilha de histórico e disparar showBackChip', () => {
    const store = useReaderStore()
    const nav = useReadingNavigation()

    // Configura mock document
    store.document = {
      type: 'epub',
      totalPages: 10,
      metadata: { title: 'Livro' },
      isLoaded: true,
      destroy: () => {}
    } as any
    store.position = { kind: 'epub', sectionIndex: 0, charOffset: 0 }

    expect(nav.canGoBack.value).toBe(false)
    expect(nav.showBackChip.value).toBe(false)

    // Pula para nova posição
    nav.goToPosition({ kind: 'epub', sectionIndex: 4, charOffset: 100 })

    expect(nav.canGoBack.value).toBe(true)
    expect(nav.showBackChip.value).toBe(true)
    expect(nav.historyStack.value).toHaveLength(1)
    expect(nav.historyStack.value[0]).toEqual({ kind: 'epub', sectionIndex: 0, charOffset: 0 })

    // Voltar deve desempilhar e retornar à posição anterior
    nav.goBack()
    expect(nav.canGoBack.value).toBe(false)
    expect(store.position).toEqual({ kind: 'epub', sectionIndex: 0, charOffset: 0 })
  })
})

describe('legacyPositionResolver', () => {
  it('1. Deve resolver diretamente PDF page:N', async () => {
    const res = await resolveLegacyPosition(
      { cfi: 'page:15' },
      { docType: 'pdf', totalPages: 100 }
    )
    expect(res.position).toEqual({ kind: 'pdf', page: 15 })
    expect(res.unit).toBe(15)
    expect(res.isApproximate).toBe(false)
  })

  it('2. Deve resolver EPUB canônico sem aproximação', async () => {
    const locationIndex = createExactIndex([2048, 2048])
    const res = await resolveLegacyPosition(
      { cfi: 'epub:1:500' },
      { docType: 'epub', locationIndex }
    )
    expect(res.position).toEqual({ kind: 'epub', sectionIndex: 1, charOffset: 500 })
    expect(res.isApproximate).toBe(false)
  })

  it('3. Deve resolver EPUB legado por busca textual exata', async () => {
    const sectionProvider = {
      getSectionCount: () => 3,
      getSectionText: vi.fn(async (idx: number) => {
        if (idx === 1) return 'Texto inicial com um trecho específico relevante que foi anotado anteriormente pelo leitor.'
        return 'Outro texto sem relevância.'
      })
    }

    const res = await resolveLegacyPosition(
      { cfi: 'page:5', selectedText: 'trecho específico relevante' },
      { docType: 'epub', totalPages: 10, sectionProvider }
    )

    expect(res.position.kind).toBe('epub')
    if (res.position.kind === 'epub') {
      expect(res.position.sectionIndex).toBe(1)
      expect(res.position.charOffset).toBeGreaterThan(0)
    }
    expect(res.isApproximate).toBe(false)
  })

  it('4. Deve fazer fallback proporcional se busca de texto falhar', async () => {
    const sectionProvider = {
      getSectionCount: () => 4,
      getSectionText: vi.fn(async () => 'Nenhum match aqui.')
    }

    const res = await resolveLegacyPosition(
      { cfi: 'page:8', selectedText: 'trecho não encontrado' },
      { docType: 'epub', totalPages: 10, sectionProvider }
    )

    expect(res.position.kind).toBe('epub')
    expect(res.isApproximate).toBe(true)
  })
})
