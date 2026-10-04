import { describe, it, expect } from 'vitest'
import {
  normalizeEpubToc,
  normalizePdfToc,
  type RawEpubTocItem,
  type RawPdfOutlineItem
} from '~/utils/reader/toc/tocNormalizer'
import { createExactIndex } from '~/utils/reader/position/locationIndex'

describe('tocNormalizer', () => {
  describe('normalizeEpubToc', () => {
    it('normaliza árvore de TOC aninhada com posições e localizações', () => {
      const rawToc: RawEpubTocItem[] = [
        {
          label: 'Capítulo 1',
          href: 'text/ch1.xhtml',
          subitems: [
            {
              label: 'Seção 1.1',
              href: 'text/ch1.xhtml#sec1'
            }
          ]
        },
        {
          label: 'Capítulo 2',
          href: 'text/ch2.xhtml'
        }
      ]

      const resolveHref = (href: string) => {
        if (href.startsWith('text/ch1.xhtml#sec1')) return { sectionIndex: 0, charOffset: 500 }
        if (href.startsWith('text/ch1.xhtml')) return { sectionIndex: 0, charOffset: 0 }
        if (href.startsWith('text/ch2.xhtml')) return { sectionIndex: 1, charOffset: 0 }
        return null
      }

      // Seção 0 = 2048 chars (2 locs), Seção 1 = 1024 chars (1 loc)
      const locationIndex = createExactIndex([2048, 1024])

      const toc = normalizeEpubToc(rawToc, resolveHref, locationIndex)

      expect(toc).toHaveLength(2)
      expect(toc[0]!.label).toBe('Capítulo 1')
      expect(toc[0]!.depth).toBe(0)
      expect(toc[0]!.unit).toBe(1)
      expect(toc[0]!.position).toEqual({ kind: 'epub', sectionIndex: 0, charOffset: 0 })

      expect(toc[0]!.children).toHaveLength(1)
      expect(toc[0]!.children![0]!.label).toBe('Seção 1.1')
      expect(toc[0]!.children![0]!.depth).toBe(1)
      expect(toc[0]!.children![0]!.unit).toBe(1) // 500 chars ainda é loc 1
      expect(toc[0]!.children![0]!.position).toEqual({ kind: 'epub', sectionIndex: 0, charOffset: 500 })

      expect(toc[1]!.label).toBe('Capítulo 2')
      expect(toc[1]!.depth).toBe(0)
      expect(toc[1]!.unit).toBe(3) // 2048 chars antes = loc 3
      expect(toc[1]!.position).toEqual({ kind: 'epub', sectionIndex: 1, charOffset: 0 })
    })

    it('lida com entradas vazias e fallbacks', () => {
      const toc = normalizeEpubToc([], () => null)
      expect(toc).toEqual([])
    })
  })

  describe('normalizePdfToc', () => {
    it('normaliza outline de PDF com destinos assíncronos', async () => {
      const rawOutline: RawPdfOutlineItem[] = [
        {
          title: 'Introdução',
          dest: 'page.1',
          items: [
            {
              title: 'Contexto',
              dest: 'page.3'
            }
          ]
        },
        {
          title: 'Conclusão',
          dest: 'page.10'
        }
      ]

      const resolveDest = async (dest: any) => {
        if (dest === 'page.1') return 1
        if (dest === 'page.3') return 3
        if (dest === 'page.10') return 10
        return null
      }

      const toc = await normalizePdfToc(rawOutline, resolveDest)

      expect(toc).toHaveLength(2)
      expect(toc[0]!.label).toBe('Introdução')
      expect(toc[0]!.unit).toBe(1)
      expect(toc[0]!.position).toEqual({ kind: 'pdf', page: 1 })
      expect(toc[0]!.children![0]!.label).toBe('Contexto')
      expect(toc[0]!.children![0]!.unit).toBe(3)
      expect(toc[0]!.children![0]!.position).toEqual({ kind: 'pdf', page: 3 })

      expect(toc[1]!.label).toBe('Conclusão')
      expect(toc[1]!.unit).toBe(10)
      expect(toc[1]!.position).toEqual({ kind: 'pdf', page: 10 })
    })
  })
})
