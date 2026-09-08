import type { ICoverExtractor, ExtractedCoverResult } from './ICoverExtractor'

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function getMimeType(fileName: string): string {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  return 'image/jpeg'
}

export class EpubCoverExtractor implements ICoverExtractor {
  readonly supportedType = 'epub' as const

  async extractCover(
    source: File | Blob | ArrayBuffer,
    _fileName?: string
  ): Promise<ExtractedCoverResult | null> {
    try {
      const { unzipSync } = await import('fflate')

      let arrayBuffer: ArrayBuffer
      if (source instanceof Blob) {
        arrayBuffer = await source.arrayBuffer()
      } else {
        arrayBuffer = source
      }

      const zipData = new Uint8Array(arrayBuffer)
      let unzipped: any = null
      try {
        unzipped = unzipSync(zipData)
      } catch (zipErr) {
        // Arquivo zip inválido ou mock de teste sem header zip válido
        return null
      }
      if (!unzipped) return null

      // 1. Localiza o arquivo OPF principal via META-INF/container.xml
      let opfPath = ''
      const containerBytes = unzipped['META-INF/container.xml']
      if (containerBytes) {
        const decoder = new TextDecoder()
        const containerXml = decoder.decode(containerBytes)
        const match = containerXml.match(/full-path=["']([^"']+)["']/i)
        if (match && match[1]) {
          opfPath = match[1].trim()
        }
      }

      let opfDir = ''
      let opfXml = ''
      if (opfPath && unzipped[opfPath]) {
        opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : ''
        opfXml = new TextDecoder().decode(unzipped[opfPath])
      } else {
        // Fallback: procura qualquer arquivo .opf no zip
        for (const key of Object.keys(unzipped)) {
          if (key.toLowerCase().endsWith('.opf')) {
            opfPath = key
            opfDir = key.includes('/') ? key.slice(0, key.lastIndexOf('/') + 1) : ''
            opfXml = new TextDecoder().decode(unzipped[key]!)
            break
          }
        }
      }

      // ESTRATÉGIA 1: Definição oficial de capa nos metadados/manifesto do OPF
      if (opfXml) {
        // 1.1: Procura <item properties="cover-image" href="...">
        const coverItemRegex = /<item\s+[^>]*properties=["'][^"']*cover-image[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i
        const altCoverItemRegex = /<item\s+[^>]*href=["']([^"']+)["'][^>]*properties=["'][^"']*cover-image[^"']*["'][^>]*>/i
        let coverHref = opfXml.match(coverItemRegex)?.[1] || opfXml.match(altCoverItemRegex)?.[1]

        // 1.2: Procura <meta name="cover" content="item_id"/> e busca o id no manifesto
        if (!coverHref) {
          const metaCoverRegex = /<meta\s+[^>]*name=["']cover["'][^>]*content=["']([^"']+)["'][^>]*>/i
          const metaCoverMatch = opfXml.match(metaCoverRegex)
          if (metaCoverMatch && metaCoverMatch[1]) {
            const coverId = metaCoverMatch[1]
            const idItemRegex = new RegExp(
              `<item\\s+[^>]*id=["']${coverId}["'][^>]*href=["']([^"']+)["'][^>]*>`,
              'i'
            )
            const idMatch = opfXml.match(idItemRegex)
            if (idMatch && idMatch[1]) {
              coverHref = idMatch[1]
            }
          }
        }

        if (coverHref) {
          const resolvedCoverPath = (opfDir + coverHref).replace(/^\//, '')
          const coverBytes = unzipped[resolvedCoverPath] || unzipped[decodeURIComponent(resolvedCoverPath)]
          if (coverBytes && coverBytes.byteLength > 0) {
            const mimeType = getMimeType(resolvedCoverPath)
            const blob = new Blob([coverBytes.buffer as ArrayBuffer], { type: mimeType })
            const base64 = uint8ArrayToBase64(coverBytes)
            return {
              blob,
              dataUrl: `data:${mimeType};base64,${base64}`,
              mimeType,
              source: 'definition',
            }
          }
        }
      }

      // ESTRATÉGIA 2: Procura no zip por arquivos de imagem com 'cover' ou 'capa' no nome
      for (const [key, rawBytes] of Object.entries(unzipped)) {
        const bytes = rawBytes as Uint8Array
        const lower = key.toLowerCase()
        if (
          (lower.includes('cover') || lower.includes('capa')) &&
          (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp'))
        ) {
          if (bytes && bytes.byteLength > 0) {
            const mimeType = getMimeType(key)
            const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeType })
            const base64 = uint8ArrayToBase64(bytes)
            return {
              blob,
              dataUrl: `data:${mimeType};base64,${base64}`,
              mimeType,
              source: 'definition',
            }
          }
        }
      }

      // ESTRATÉGIA 3 (FALLBACK): Primeira página do spine
      if (opfXml) {
        // Encontra o primeiro <itemref idref="..."> dentro de <spine>
        const spineMatch = opfXml.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i)
        if (spineMatch && spineMatch[1]) {
          const firstItemrefMatch = spineMatch[1].match(/<itemref\s+[^>]*idref=["']([^"']+)["'][^>]*>/i)
          if (firstItemrefMatch && firstItemrefMatch[1]) {
            const firstId = firstItemrefMatch[1]
            const manifestItemRegex = new RegExp(
              `<item\\s+[^>]*id=["']${firstId}["'][^>]*href=["']([^"']+)["'][^>]*>`,
              'i'
            )
            const itemMatch = opfXml.match(manifestItemRegex)
            if (itemMatch && itemMatch[1]) {
              const firstPagePath = (opfDir + itemMatch[1]).replace(/^\//, '')
              const firstPageBytes = unzipped[firstPagePath] || unzipped[decodeURIComponent(firstPagePath)]
              if (firstPageBytes) {
                const htmlContent = new TextDecoder().decode(firstPageBytes)
                
                // 3.1: Verifica se há imagem dentro da primeira seção (img src ou image xlink:href)
                const imgMatch =
                  htmlContent.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i) ||
                  htmlContent.match(/<image\s+[^>]*href=["']([^"']+)["'][^>]*>/i) ||
                  htmlContent.match(/<image\s+[^>]*xlink:href=["']([^"']+)["'][^>]*>/i)

                if (imgMatch && imgMatch[1]) {
                  const firstDir = firstPagePath.includes('/') ? firstPagePath.slice(0, firstPagePath.lastIndexOf('/') + 1) : ''
                  const resolvedImgPath = (firstDir + imgMatch[1]).replace(/^\//, '')
                  const imgBytes = unzipped[resolvedImgPath] || unzipped[decodeURIComponent(resolvedImgPath)]
                  if (imgBytes && imgBytes.byteLength > 0) {
                    const mimeType = getMimeType(resolvedImgPath)
                    const blob = new Blob([imgBytes.buffer as ArrayBuffer], { type: mimeType })
                    const base64 = uint8ArrayToBase64(imgBytes)
                    return {
                      blob,
                      dataUrl: `data:${mimeType};base64,${base64}`,
                      mimeType,
                      source: 'first-page',
                    }
                  }
                }

                // 3.2: Renderiza a primeira página em canvas gráfico como capa
                if (typeof document !== 'undefined') {
                  const rendered = await this.renderHtmlToCoverCanvas(htmlContent)
                  if (rendered) return rendered
                }
              }
            }
          }
        }
      }

      return null
    } catch (err) {
      console.warn('[EpubCoverExtractor] Erro ao extrair capa do EPUB:', err)
      return null
    }
  }

  private async renderHtmlToCoverCanvas(htmlContent: string): Promise<ExtractedCoverResult | null> {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlContent, 'text/html')
      const text = (doc.body.textContent || '').trim().slice(0, 300)

      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 900
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // Fundo editorial elegante
      const gradient = ctx.createLinearGradient(0, 0, 600, 900)
      gradient.addColorStop(0, '#1E232A')
      gradient.addColorStop(1, '#111418')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 600, 900)

      // Borda decorativa sutil
      ctx.strokeStyle = '#E57B55'
      ctx.lineWidth = 4
      ctx.strokeRect(30, 30, 540, 840)

      // Tipografia da capa de fallback
      ctx.fillStyle = '#E57B55'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText('ARESTA LIVRO', 60, 90)

      ctx.fillStyle = '#F3F4F6'
      ctx.font = '24px serif'
      
      // Quebra linhas de texto
      const words = text.split(/\s+/)
      let line = ''
      let y = 180
      for (const word of words) {
        const testLine = line + word + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > 480 && line !== '') {
          ctx.fillText(line, 60, y)
          line = word + ' '
          y += 36
          if (y > 700) break
        } else {
          line = testLine
        }
      }
      if (line && y <= 700) {
        ctx.fillText(line, 60, y)
      }

      const mimeType = 'image/webp'
      const dataUrl = canvas.toDataURL(mimeType, 0.88)
      const byteString = atob(dataUrl.split(',')[1] || '')
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab], { type: mimeType })

      return {
        blob,
        dataUrl,
        mimeType,
        width: 600,
        height: 900,
        source: 'first-page',
      }
    } catch {
      return null
    }
  }
}
