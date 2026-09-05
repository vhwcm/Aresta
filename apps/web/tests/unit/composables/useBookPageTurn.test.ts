import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useBookPageTurn, shouldCommitPageTurn, TURN_THRESHOLD } from '~/composables/reader/useBookPageTurn'
import { useReaderStore } from '~/stores/readerStore'

describe('shouldCommitPageTurn', () => {
  it('confirma virada exatamente no limiar de arraste', () => {
    expect(shouldCommitPageTurn(TURN_THRESHOLD, 0)).toBe(true)
  })

  it('cancela virada logo abaixo do limiar sem velocidade', () => {
    expect(shouldCommitPageTurn(TURN_THRESHOLD - 0.01, 0)).toBe(false)
  })

  it('cancela virada curta e lenta (velocidade exatamente no limite)', () => {
    expect(shouldCommitPageTurn(TURN_THRESHOLD - 0.01, 0.002)).toBe(false)
  })

  it('confirma gesto rápido abaixo do limiar de distância', () => {
    expect(shouldCommitPageTurn(0.1, 0.0021)).toBe(true)
  })

  it('cancela progresso zero com velocidade zero', () => {
    expect(shouldCommitPageTurn(0, 0)).toBe(false)
  })

  it('confirma progresso máximo', () => {
    expect(shouldCommitPageTurn(1, 0)).toBe(true)
  })

  it('cancela velocidade negativa (gesto na direção errada)', () => {
    expect(shouldCommitPageTurn(0.1, -0.01)).toBe(false)
  })

  it('confirma gesto mais rápido que o limiar', () => {
    expect(shouldCommitPageTurn(0.0, 0.005)).toBe(true)
  })
})

describe('useBookPageTurn Layout e Navegação', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('posiciona a página 1 (Capa) à esquerda e a página 2 à direita no modo 2 páginas', () => {
    const store = useReaderStore()
    store.setTwoPageMode(true)
    store.setDocument({
      type: 'epub',
      totalPages: 10,
      metadata: { title: 'Livro Teste' },
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      destroy: vi.fn(),
    } as any, 'livro.epub')

    const host = document.createElement('div')
    Object.defineProperty(host, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(host, 'clientHeight', { value: 800, configurable: true })
    const hostRef = ref(host)

    const turn = useBookPageTurn(hostRef)
    turn.updateLayout()

    expect(turn.pageLayout.value.isTwoPage).toBe(true)
    expect(turn.pageLayout.value.leftPage).not.toBeNull()
    expect(turn.pageLayout.value.leftPage?.pageNumber).toBe(1)
    expect(turn.pageLayout.value.rightPage).not.toBeNull()
    expect(turn.pageLayout.value.rightPage?.pageNumber).toBe(2)
  })

  it('posiciona spread com página ímpar à esquerda e par à direita a partir da página 3', () => {
    const store = useReaderStore()
    store.setTwoPageMode(true)
    store.setDocument({
      type: 'epub',
      totalPages: 10,
      metadata: { title: 'Livro Teste' },
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      destroy: vi.fn(),
    } as any, 'livro.epub')

    const host = document.createElement('div')
    Object.defineProperty(host, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(host, 'clientHeight', { value: 800, configurable: true })
    const hostRef = ref(host)

    const turn = useBookPageTurn(hostRef)

    store.goToPage(3)
    turn.updateLayout()

    expect(turn.pageLayout.value.isTwoPage).toBe(true)
    expect(turn.pageLayout.value.leftPage?.pageNumber).toBe(3)
    expect(turn.pageLayout.value.rightPage?.pageNumber).toBe(4)
  })
})
