import { describe, it, expect } from 'vitest'
import { shouldCommitPageTurn } from '~/composables/reader/useBookPageTurn'

describe('shouldCommitPageTurn', () => {
  it('confirma virada exatamente no limiar de arraste', () => {
    expect(shouldCommitPageTurn(0.32, 0)).toBe(true)
  })

  it('cancela virada logo abaixo do limiar sem velocidade', () => {
    expect(shouldCommitPageTurn(0.31, 0)).toBe(false)
  })

  it('cancela virada curta e lenta (velocidade exatamente no limite)', () => {
    expect(shouldCommitPageTurn(0.31, 0.002)).toBe(false)
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
