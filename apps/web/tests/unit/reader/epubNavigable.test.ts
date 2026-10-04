import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EpubDocumentAdapter } from '~/adapters/EpubDocumentAdapter'

// Mock foliate-js/epub.js
vi.mock('foliate-js/epub.js', () => {
  return {
    EPUB: class MockEPUB {
      metadata = { title: 'EPUB Navegável', creator: 'Autor' }
      toc = [
        { label: 'Capítulo 1', href: 'text/ch1.xhtml' },
        { label: 'Capítulo 2', href: 'text/ch2.xhtml' }
      ]
      sections = [
        {
          id: 'text/ch1.xhtml',
          linear: true,
          createDocument: () => Promise.resolve({
            body: { innerHTML: '<p>' + 'A'.repeat(2048) + '</p>', textContent: 'A'.repeat(2048) }
          })
        },
        {
          id: 'text/ch2.xhtml',
          linear: true,
          createDocument: () => Promise.resolve({
            body: { innerHTML: '<p>' + 'B'.repeat(1024) + '</p>', textContent: 'B'.repeat(1024) }
          })
        }
      ]
      init() {
        return Promise.resolve()
      }
    }
  }
})

describe('EpubDocumentAdapter INavigableDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('implementa contrato INavigableDocument com localizações e sumário', async () => {
    const { zipSync, strToU8 } = await import('fflate')
    const zipData = zipSync({
      'mimetype': strToU8('application/epub+zip'),
      'META-INF/container.xml': strToU8('<container><rootfiles><rootfile full-path="content.opf"/></rootfiles></container>'),
      'content.opf': strToU8('<package><manifest><item id="ch1" href="text/ch1.xhtml"/></manifest></package>')
    })

    const adapter = new EpubDocumentAdapter()
    await adapter.load(zipData.buffer as ArrayBuffer, 'navegavel.epub')

    expect(adapter.isLoaded).toBe(true)

    // Unidades totais (localizações)
    const totalUnits = adapter.getTotalUnits()
    expect(totalUnits).toBeGreaterThanOrEqual(1)

    // Conversão de posição para unidade e vice-versa
    const unit1 = adapter.positionToUnit({ kind: 'epub', sectionIndex: 0, charOffset: 0 })
    expect(unit1).toBe(1)

    const pos = adapter.unitToPosition(1)
    expect(pos).toEqual({ kind: 'epub', sectionIndex: 0, charOffset: 0 })

    // Sumário estruturado
    const toc = await adapter.getToc()
    expect(toc).toHaveLength(2)
    expect(toc[0]!.label).toBe('Capítulo 1')
    expect(toc[0]!.position.kind).toBe('epub')
    expect(toc[1]!.label).toBe('Capítulo 2')

    // Callback onIndexRefined
    const callback = vi.fn()
    const unsubscribe = adapter.onIndexRefined(callback)
    expect(typeof unsubscribe).toBe('function')
    unsubscribe()

    adapter.destroy()
    expect(adapter.isLoaded).toBe(false)
  })
})
