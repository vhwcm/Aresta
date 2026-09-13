import { describe, it, expect } from 'vitest'
import {
  generateDidacticCoverSvg,
  generateDidacticCoverDataUri,
  getCoverUrl,
  getBookFormat,
  resolveBookCover,
} from '../../../app/utils/cover'

describe('Cover Utilities (aresta-reader/cover)', () => {
  it('1. Deve gerar SVG válido com proporção 2:3 e elementos de encadernação clássica', () => {
    const svg = generateDidacticCoverSvg({
      title: 'Estruturas de Dados Avançadas',
      topic: 'Árvores B & Grafos',
      themeName: 'Ciência da Computação',
    })

    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox="0 0 600 900"')
    expect(svg).toContain('ARESTA DIDACTIC')
    expect(svg).toContain('CIÊNCIA DA COMPUTAÇÃO')
    expect(svg).toContain('Estruturas de Dados')
    expect(svg).toContain('Árvores B &amp; Grafos')
    expect(svg).toContain('INTELIGÊNCIA ARTIFICIAL')
  })

  it('2. Deve gerar data URI em base64 funcional para capas de livretos', () => {
    const dataUri = generateDidacticCoverDataUri({
      title: 'Princípios SOLID',
    })

    expect(dataUri.startsWith('data:image/svg+xml;base64,')).toBe(true)
    const base64Content = dataUri.replace('data:image/svg+xml;base64,', '')
    const decoded = Buffer.from(base64Content, 'base64').toString('utf-8')
    expect(decoded).toContain('Princípios SOLID')
  })

  it('3. Deve identificar formato DIDACTIC corretamente', () => {
    expect(getBookFormat('virtual://didactic/Arquitetura')).toBe('DIDACTIC')
    expect(getBookFormat('storage/books/didactic-123.ardoc')).toBe('DIDACTIC')
    expect(getBookFormat('storage/books/livro.pdf')).toBe('PDF')
    expect(getBookFormat('storage/books/livro.epub')).toBe('EPUB')
  })

  it('4. Deve resolver capa de livro normal via getCoverUrl e de livreto via resolveBookCover', () => {
    const normalBook = {
      coverPath: 'storage/covers/clean-code.png',
      bookId: 10,
      filePath: 'storage/books/clean-code.epub',
      title: 'Clean Code',
    }
    expect(resolveBookCover(normalBook)).toContain('/api/books/10/cover')

    const didacticBookWithoutCover = {
      coverPath: null,
      bookId: 20,
      filePath: 'virtual://didactic/Design Patterns',
      title: 'Design Patterns',
      themes: [{ name: 'Engenharia de Software' }],
    }
    const didacticCover = resolveBookCover(didacticBookWithoutCover)
    expect(didacticCover.startsWith('data:image/svg+xml;base64,')).toBe(true)
  })
})
