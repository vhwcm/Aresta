import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CoverExtractorFactory } from '~/adapters/cover/CoverExtractorFactory'
import { PdfCoverExtractor } from '~/adapters/cover/PdfCoverExtractor'
import { EpubCoverExtractor } from '~/adapters/cover/EpubCoverExtractor'
import type { ICoverExtractor } from '~/adapters/cover/ICoverExtractor'

describe('CoverExtractors & Factory (SOLID)', () => {
  beforeEach(() => {
    CoverExtractorFactory.clearExtractors()
  })

  it('deve retornar PdfCoverExtractor para o tipo pdf', () => {
    const extractor = CoverExtractorFactory.getExtractor('pdf')
    expect(extractor).toBeInstanceOf(PdfCoverExtractor)
    expect(extractor?.supportedType).toBe('pdf')
  })

  it('deve retornar EpubCoverExtractor para o tipo epub', () => {
    const extractor = CoverExtractorFactory.getExtractor('epub')
    expect(extractor).toBeInstanceOf(EpubCoverExtractor)
    expect(extractor?.supportedType).toBe('epub')
  })

  it('deve retornar null para formatos não suportados', () => {
    const extractor = CoverExtractorFactory.getExtractor('mobi')
    expect(extractor).toBeNull()
  })

  it('permite registrar extrator customizado (Princípio Aberto/Fechado - OCP)', () => {
    const customExtractor: ICoverExtractor = {
      supportedType: 'pdf',
      extractCover: vi.fn().mockResolvedValue({
        blob: new Blob([]),
        dataUrl: 'data:image/webp;base64,mock',
        mimeType: 'image/webp',
        source: 'definition',
      }),
    }

    CoverExtractorFactory.registerExtractor(customExtractor)
    const resolved = CoverExtractorFactory.getExtractor('pdf')
    expect(resolved).toBe(customExtractor)
  })

  it('extrai capa de EPUB com metadado cover no OPF', async () => {
    // Cria mock de EPUB estruturado via fflate
    const opfContent = `<?xml version="1.0"?>
    <package xmlns="http://www.idpf.org/2007/opf" version="3.0">
      <manifest>
        <item id="cover-img" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>
        <item id="page1" href="text/ch1.xhtml" media-type="application/xhtml+xml"/>
      </manifest>
      <spine>
        <itemref idref="page1"/>
      </spine>
    </package>`

    const { zipSync } = await import('fflate')
    const zipData = zipSync({
      'META-INF/container.xml': new TextEncoder().encode(
        '<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>'
      ),
      'OEBPS/content.opf': new TextEncoder().encode(opfContent),
      'OEBPS/images/cover.jpg': new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x01, 0x02]),
    })

    const extractor = new EpubCoverExtractor()
    const result = await extractor.extractCover(zipData.buffer)

    expect(result).not.toBeNull()
    expect(result?.source).toBe('definition')
    expect(result?.mimeType).toBe('image/jpeg')
    expect(result?.dataUrl).toContain('data:image/jpeg;base64,')
  })

  it('usa fallback de primeira página para EPUB sem capa declarada', async () => {
    const opfContent = `<?xml version="1.0"?>
    <package xmlns="http://www.idpf.org/2007/opf" version="3.0">
      <manifest>
        <item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
      </manifest>
      <spine>
        <itemref idref="ch1"/>
      </spine>
    </package>`

    const ch1Content = `<html><body><img src="first_page.png"/></body></html>`

    const { zipSync } = await import('fflate')
    const zipData = zipSync({
      'META-INF/container.xml': new TextEncoder().encode(
        '<container><rootfiles><rootfile full-path="content.opf"/></rootfiles></container>'
      ),
      'content.opf': new TextEncoder().encode(opfContent),
      'ch1.xhtml': new TextEncoder().encode(ch1Content),
      'first_page.png': new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    })

    const extractor = new EpubCoverExtractor()
    const result = await extractor.extractCover(zipData.buffer)

    expect(result).not.toBeNull()
    expect(result?.source).toBe('first-page')
    expect(result?.mimeType).toBe('image/png')
  })
})
