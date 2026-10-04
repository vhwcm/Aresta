import { describe, it, expect } from 'vitest'
import {
  createEstimatedIndex,
  createExactIndex
} from '~/utils/reader/position/locationIndex'
import { LOCATION_SIZE } from '~/utils/reader/position/readingPosition'

describe('locationIndex', () => {
  describe('createExactIndex', () => {
    it('calcula totalLocations corretamente', () => {
      // 3 seções: 1024 chars cada = 3072 chars total = 3 localizações
      const index = createExactIndex([1024, 1024, 1024])
      expect(index.isExact).toBe(true)
      expect(index.totalLocations).toBe(3)
    })

    it('arredonda para cima se sobrar caracteres no final', () => {
      // 1025 chars = 2 localizações
      const index = createExactIndex([1025])
      expect(index.totalLocations).toBe(2)
    })

    it('retorna 1 localização para livro vazio', () => {
      const indexEmpty = createExactIndex([])
      expect(indexEmpty.totalLocations).toBe(1)

      const indexZero = createExactIndex([0, 0])
      expect(indexZero.totalLocations).toBe(1)
    })

    it('converte posição para localização (1-based)', () => {
      const index = createExactIndex([2048, 2048]) // total 4096 = 4 locs
      // Seção 0, char 0 -> loc 1
      expect(index.toLocation({ kind: 'epub', sectionIndex: 0, charOffset: 0 })).toBe(1)
      // Seção 0, char 1023 -> loc 1
      expect(index.toLocation({ kind: 'epub', sectionIndex: 0, charOffset: 1023 })).toBe(1)
      // Seção 0, char 1024 -> loc 2
      expect(index.toLocation({ kind: 'epub', sectionIndex: 0, charOffset: 1024 })).toBe(2)
      // Seção 1, char 0 (global char 2048) -> loc 3
      expect(index.toLocation({ kind: 'epub', sectionIndex: 1, charOffset: 0 })).toBe(3)
      // Seção 1, char 2048 (fim do livro) -> loc 4
      expect(index.toLocation({ kind: 'epub', sectionIndex: 1, charOffset: 2048 })).toBe(4)
    })

    it('converte localização para posição (fromLocation)', () => {
      const index = createExactIndex([2048, 2048])
      // Loc 1 -> Seção 0, char 0
      expect(index.fromLocation(1)).toEqual({ kind: 'epub', sectionIndex: 0, charOffset: 0 })
      // Loc 2 -> Seção 0, char 1024
      expect(index.fromLocation(2)).toEqual({ kind: 'epub', sectionIndex: 0, charOffset: 1024 })
      // Loc 3 -> Seção 1, char 0
      expect(index.fromLocation(3)).toEqual({ kind: 'epub', sectionIndex: 1, charOffset: 0 })
      // Loc 4 -> Seção 1, char 1024
      expect(index.fromLocation(4)).toEqual({ kind: 'epub', sectionIndex: 1, charOffset: 1024 })
    })

    it('retorna sectionStartLocation correto', () => {
      const index = createExactIndex([1024, 2048, 1024])
      expect(index.sectionStartLocation(0)).toBe(1)
      expect(index.sectionStartLocation(1)).toBe(2) // char 1024 = loc 2
      expect(index.sectionStartLocation(2)).toBe(4) // char 3072 = loc 4
    })
  })

  describe('createEstimatedIndex e withExactSection', () => {
    it('cria índice estimado inicial a partir de bytes descompactados', () => {
      // 10000 bytes * 0.45 = 4500 chars -> ceil(4500 / 1024) = 5 localizações
      const index = createEstimatedIndex([10000])
      expect(index.isExact).toBe(false)
      expect(index.totalLocations).toBe(5)
    })

    it('atualiza de forma imutável com withExactSection e converge para isExact', () => {
      const initial = createEstimatedIndex([10000, 10000])
      expect(initial.isExact).toBe(false)

      const step1 = initial.withExactSection(0, 3000)
      expect(step1.isExact).toBe(false)
      // initial permanece inalterado
      expect(initial.getCharsPerSection()[0]).toBe(4500)
      expect(step1.getCharsPerSection()[0]).toBe(3000)

      const step2 = step1.withExactSection(1, 4000)
      expect(step2.isExact).toBe(true)
      expect(step2.getCharsPerSection()).toEqual([3000, 4000])
      // Total: 7000 chars -> ceil(7000 / 1024) = 7
      expect(step2.totalLocations).toBe(7)
    })
  })
})
