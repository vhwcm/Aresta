import { describe, it, expect, beforeEach } from 'vitest'
import {
  hexToRgba,
  getAnnotationPageNumber,
  getVisibleTextChunks,
  clearPageHighlights,
  applyAnnotationHighlight,
  applyPageHighlights,
} from '~/utils/readerHighlight'
import type { AnnotationItem } from '~/composables/useAnnotations'

describe('readerHighlight utility', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  describe('hexToRgba', () => {
    it('converte hex de 6 dígitos para rgba com transparência padrão', () => {
      expect(hexToRgba('#F59E0B')).toBe('rgba(245, 158, 11, 0.38)')
      expect(hexToRgba('#10B981')).toBe('rgba(16, 185, 129, 0.38)')
      expect(hexToRgba('#E57B55')).toBe('rgba(229, 123, 85, 0.38)')
    })

    it('permite definir alpha customizado', () => {
      expect(hexToRgba('#3B82F6', 0.5)).toBe('rgba(59, 130, 246, 0.5)')
    })

    it('converte hex de 3 dígitos', () => {
      expect(hexToRgba('#FFF')).toBe('rgba(255, 255, 255, 0.38)')
    })

    it('retorna fallback gracioso quando hex é inválido ou vazio', () => {
      expect(hexToRgba(null)).toBe('rgba(229, 123, 85, 0.38)')
      expect(hexToRgba('')).toBe('rgba(229, 123, 85, 0.38)')
      expect(hexToRgba('invalid')).toBe('rgba(229, 123, 85, 0.38)')
    })
  })

  describe('getAnnotationPageNumber', () => {
    it('extrai página de cfi no formato page:X', () => {
      const ann: Partial<AnnotationItem> = { cfi: 'page:15' }
      expect(getAnnotationPageNumber(ann as AnnotationItem)).toBe(15)
    })

    it('extrai página de chapterTitle quando cfi não possui', () => {
      const ann: Partial<AnnotationItem> = { chapterTitle: 'Capítulo 2 - Página 42' }
      expect(getAnnotationPageNumber(ann as AnnotationItem)).toBe(42)
    })

    it('retorna null se não houver indicação de página', () => {
      const ann: Partial<AnnotationItem> = { cfi: '/6/4[chap01]!/4/2/10' }
      expect(getAnnotationPageNumber(ann as AnnotationItem)).toBeNull()
    })
  })

  describe('applyAnnotationHighlight', () => {
    it('destaca trecho de texto dentro de um único nó de texto com a cor selecionada', () => {
      container.innerHTML = '<p>O Alienista foi escrito por Machado de Assis no século XIX.</p>'

      const annotation: AnnotationItem = {
        id: 101,
        userId: 1,
        bookId: 10,
        cfi: 'page:1',
        selectedText: 'Machado de Assis',
        color: '#10B981', // Verde Menta
        note: 'Autor icônico do realismo brasileiro',
        createdAt: new Date().toISOString(),
      }

      const applied = applyAnnotationHighlight(container, annotation)
      expect(applied).toBe(true)

      const marks = container.querySelectorAll('mark.reader-highlight')
      expect(marks.length).toBe(1)
      const mark = marks[0] as HTMLElement
      expect(mark.textContent).toBe('Machado de Assis')
      expect(mark.getAttribute('data-annotation-id')).toBe('101')
      expect(mark.style.backgroundColor).toBe('rgba(16, 185, 129, 0.38)')
      expect(mark.style.borderBottom).toBe('2px solid #10B981')
      expect(mark.title).toBe('Autor icônico do realismo brasileiro')
    })

    it('destaca texto mesmo quando há múltiplas quebras de linha ou espaços no HTML', () => {
      container.innerHTML = '<p>No princípio\n    era o Verbo,\n  e o Verbo estava com Deus.</p>'

      const annotation: AnnotationItem = {
        id: 102,
        userId: 1,
        bookId: 10,
        cfi: 'page:1',
        selectedText: 'No princípio era o Verbo,',
        color: '#F59E0B', // Amarelo
        createdAt: new Date().toISOString(),
      }

      const applied = applyAnnotationHighlight(container, annotation)
      expect(applied).toBe(true)

      const marks = container.querySelectorAll('mark.reader-highlight')
      expect(marks.length).toBeGreaterThan(0)
      const fullMarkText = Array.from(marks).map((m) => m.textContent).join('')
      expect(fullMarkText.replace(/\s+/g, ' ')).toContain('No princípio era o Verbo,')
    })

    it('destaca texto dividido entre múltiplos elementos inline (ex: spans em PDF ou negritos em EPUB)', () => {
      container.innerHTML = '<p><span class="p-part1">Simão Bacamarte </span><span class="p-part2">era o médico</span></p>'

      const annotation: AnnotationItem = {
        id: 103,
        userId: 1,
        bookId: 10,
        cfi: 'page:1',
        selectedText: 'Simão Bacamarte era o médico',
        color: '#EC4899', // Rosa
        createdAt: new Date().toISOString(),
      }

      const applied = applyAnnotationHighlight(container, annotation)
      expect(applied).toBe(true)

      const marks = container.querySelectorAll('mark.reader-highlight')
      expect(marks.length).toBe(2)
      expect(marks[0]?.textContent).toBe('Simão Bacamarte ')
      expect(marks[1]?.textContent).toBe('era o médico')
    })

    it('ignora nós de script ou style', () => {
      container.innerHTML = '<style>p { color: red; }</style><p>Texto limpo e legível.</p>'

      const annotation: AnnotationItem = {
        id: 104,
        userId: 1,
        bookId: 10,
        cfi: 'page:1',
        selectedText: 'limpo e legível',
        color: '#3B82F6',
        createdAt: new Date().toISOString(),
      }

      const applied = applyAnnotationHighlight(container, annotation)
      expect(applied).toBe(true)

      const marks = container.querySelectorAll('mark.reader-highlight')
      expect(marks.length).toBe(1)
      expect(marks[0]?.textContent).toBe('limpo e legível')
    })
  })

  describe('clearPageHighlights', () => {
    it('remove todas as marcações e restaura o DOM com texto original', () => {
      container.innerHTML = '<p>Texto com <mark class="reader-highlight" style="background: red;">destaque</mark> inserido.</p>'

      clearPageHighlights(container)

      expect(container.querySelectorAll('mark.reader-highlight').length).toBe(0)
      expect(container.textContent).toBe('Texto com destaque inserido.')
      // Deve ter mesclado os nós de texto adjacentes via normalize()
      expect(container.querySelector('p')?.childNodes.length).toBe(1)
    })
  })

  describe('applyPageHighlights', () => {
    it('aplica apenas anotações pertencentes à página e livro alvo', () => {
      container.innerHTML = `
        <article>
          <h1>Capítulo 1</h1>
          <p>A Casa Verde foi um marco na psiquiatria.</p>
          <p>Dona Evarista viajou para o Rio de Janeiro.</p>
        </article>
      `

      const annotations: AnnotationItem[] = [
        {
          id: 1,
          userId: 1,
          bookId: 5,
          cfi: 'page:1',
          selectedText: 'A Casa Verde',
          color: '#10B981', // Verde
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          userId: 1,
          bookId: 5,
          cfi: 'page:1',
          selectedText: 'Dona Evarista',
          color: '#8B5CF6', // Roxo
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          userId: 1,
          bookId: 5,
          cfi: 'page:2', // Página diferente
          selectedText: 'Rio de Janeiro',
          color: '#F59E0B',
          createdAt: new Date().toISOString(),
        },
        {
          id: 4,
          userId: 1,
          bookId: 99, // Livro diferente
          cfi: 'page:1',
          selectedText: 'psiquiatria',
          color: '#EC4899',
          createdAt: new Date().toISOString(),
        },
      ]

      const count = applyPageHighlights(container, 1, annotations, 5)
      expect(count).toBe(2)

      const marks = container.querySelectorAll('mark.reader-highlight')
      expect(marks.length).toBe(2)

      const casaVerdeMark = Array.from(marks).find((m) => m.textContent === 'A Casa Verde') as HTMLElement
      expect(casaVerdeMark).toBeDefined()
      expect(casaVerdeMark.style.borderBottom).toBe('2px solid #10B981')

      const donaEvaristaMark = Array.from(marks).find((m) => m.textContent === 'Dona Evarista') as HTMLElement
      expect(donaEvaristaMark).toBeDefined()
      expect(donaEvaristaMark.style.borderBottom).toBe('2px solid #8B5CF6')
    })
  })
})
