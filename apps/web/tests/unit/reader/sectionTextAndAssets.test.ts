import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { countSectionText } from '~/utils/reader/epub/sectionTextCounter'
import { resolveSectionAssets } from '~/utils/reader/epub/sectionAssetResolver'

describe('sectionTextCounter', () => {
  it('conta caracteres ignorando tags, scripts e estilos', () => {
    const html = `
      <div>
        <script>console.log("ignorar isso")</script>
        <style>body { color: red; }</style>
        <h1>Título</h1>
        <p>Texto do parágrafo <strong>com ênfase</strong>.</p>
      </div>
    `
    // Título (6) + Texto do parágrafo  (20) + com ênfase (10) + . (1)
    const count = countSectionText(html)
    // Contém o texto dos elementos e quebras de linha DOM, mas script e style são excluídos
    expect(count).toBe(79)

    // Teste com HTML limpo sem indentação
    const cleanHtml = '<h1>Título</h1><p>Texto do parágrafo <strong>com ênfase</strong>.</p><script>console.log("ignorar")</script>'
    // 'Título' (6) + 'Texto do parágrafo ' (19) + 'com ênfase' (10) + '.' (1) = 36
    expect(countSectionText(cleanHtml)).toBe(36)
  })

  it('retorna 0 para string vazia', () => {
    expect(countSectionText('')).toBe(0)
  })
})

describe('sectionAssetResolver', () => {
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL

  let createdUrls: string[] = []
  let revokedUrls: string[] = []

  beforeEach(() => {
    createdUrls = []
    revokedUrls = []
    URL.createObjectURL = vi.fn((_blob: any) => {
      const u = `blob:aresta-test/${createdUrls.length + 1}`
      createdUrls.push(u)
      return u
    })
    URL.revokeObjectURL = vi.fn((url: string) => {
      revokedUrls.push(url)
    })
  })

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('substitui caminhos de imagem por blob URLs e revoga no descarte', async () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <img src="../images/cover.jpg" />
      <img src="illustration.png" />
    `

    const mockLoader = vi.fn(async (resolvedPath: string) => {
      return new Uint8Array([1, 2, 3])
    })

    const session = await resolveSectionAssets(container, 'OEBPS/text/ch1.xhtml', mockLoader)

    expect(mockLoader).toHaveBeenCalledWith('OEBPS/images/cover.jpg')
    expect(mockLoader).toHaveBeenCalledWith('OEBPS/text/illustration.png')

    expect(session.blobUrls).toHaveLength(2)
    const imgs = container.querySelectorAll('img')
    expect(imgs[0]!.src).toBe(session.blobUrls[0])
    expect(imgs[1]!.src).toBe(session.blobUrls[1])

    // Revoga
    session.revoke()
    expect(revokedUrls).toHaveLength(2)
    expect(revokedUrls).toEqual(createdUrls)
  })
})
