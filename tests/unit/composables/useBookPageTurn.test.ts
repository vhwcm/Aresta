import { describe, expect, it } from 'vitest'
import { shouldCommitPageTurn } from '~/composables/reader/useBookPageTurn'

describe('shouldCommitPageTurn', () => {
  it('confirma uma virada que passou o limiar de arraste', () => {
    expect(shouldCommitPageTurn(0.32, 0)).toBe(true)
  })

  it('cancela uma virada curta e lenta', () => {
    expect(shouldCommitPageTurn(0.31, 0.002)).toBe(false)
  })

  it('confirma um gesto rápido mesmo abaixo do limiar de distância', () => {
    expect(shouldCommitPageTurn(0.1, 0.0021)).toBe(true)
  })
})
