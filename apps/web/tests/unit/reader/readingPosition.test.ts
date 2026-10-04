import { describe, it, expect } from 'vitest'
import {
  parsePosition,
  serializePosition,
  LOCATION_SIZE,
  type ReadingPosition,
  type LegacyEpubPage
} from '~/utils/reader/position/readingPosition'

describe('readingPosition', () => {
  it('LOCATION_SIZE deve ser 1024', () => {
    expect(LOCATION_SIZE).toBe(1024)
  })

  describe('serializePosition', () => {
    it('serializa posições de EPUB corretamente', () => {
      const pos: ReadingPosition = { kind: 'epub', sectionIndex: 3, charOffset: 512 }
      expect(serializePosition(pos)).toBe('epub:3:512')
    })

    it('serializa posições de EPUB com zeros', () => {
      const pos: ReadingPosition = { kind: 'epub', sectionIndex: 0, charOffset: 0 }
      expect(serializePosition(pos)).toBe('epub:0:0')
    })

    it('serializa posições de PDF corretamente', () => {
      const pos: ReadingPosition = { kind: 'pdf', page: 42 }
      expect(serializePosition(pos)).toBe('page:42')
    })

    it('sanitiza valores negativos ou fracionários', () => {
      expect(serializePosition({ kind: 'epub', sectionIndex: -1.5, charOffset: -10 } as any)).toBe('epub:0:0')
      expect(serializePosition({ kind: 'pdf', page: -5 } as any)).toBe('page:1')
      expect(serializePosition({ kind: 'pdf', page: 3.7 } as any)).toBe('page:3')
    })
  })

  describe('parsePosition', () => {
    it('faz parse de epub:s:o com sucesso', () => {
      const result = parsePosition('epub:12:4381')
      expect(result).toEqual({ kind: 'epub', sectionIndex: 12, charOffset: 4381 })
    })

    it('faz parse de epub:0:0 com sucesso', () => {
      const result = parsePosition('epub:0:0')
      expect(result).toEqual({ kind: 'epub', sectionIndex: 0, charOffset: 0 })
    })

    it('faz parse de page:N para pdf por padrão', () => {
      const result = parsePosition('page:37')
      expect(result).toEqual({ kind: 'pdf', page: 37 })
    })

    it('faz parse de page:N para legado quando context for epub', () => {
      const result = parsePosition('page:37', 'epub')
      expect(result).toEqual({ kind: 'legacy-page', page: 37 })
    })

    it('faz parse de legacy-page:N explicitamente', () => {
      const result = parsePosition('legacy-page:15')
      expect(result).toEqual({ kind: 'legacy-page', page: 15 })
    })

    it('faz parse de número puro com contexto', () => {
      expect(parsePosition('10', 'epub')).toEqual({ kind: 'legacy-page', page: 10 })
      expect(parsePosition('10', 'pdf')).toEqual({ kind: 'pdf', page: 10 })
      expect(parsePosition('10')).toBeNull()
    })

    it('ignora espaços em branco ao redor', () => {
      expect(parsePosition('  epub:2:100 \n')).toEqual({ kind: 'epub', sectionIndex: 2, charOffset: 100 })
      expect(parsePosition('  page:5  ')).toEqual({ kind: 'pdf', page: 5 })
    })

    it('retorna null para entradas nulas, vazias ou inválidas', () => {
      expect(parsePosition(null)).toBeNull()
      expect(parsePosition(undefined)).toBeNull()
      expect(parsePosition('')).toBeNull()
      expect(parsePosition('   ')).toBeNull()
      expect(parsePosition('invalido')).toBeNull()
      expect(parsePosition('epub:abc:def')).toBeNull()
      expect(parsePosition('epub:1')).toBeNull()
      expect(parsePosition('epub:1:2:3')).toBeNull()
      expect(parsePosition('page:0')).toBeNull()
      expect(parsePosition('page:-5')).toBeNull()
    })
  })
})
