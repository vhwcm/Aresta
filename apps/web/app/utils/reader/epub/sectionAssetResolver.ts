export interface SectionAssetSession {
  readonly blobUrls: readonly string[]
  revoke(): void
}

function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'svg':
      return 'image/svg+xml'
    case 'css':
      return 'text/css'
    default:
      return 'application/octet-stream'
  }
}

/**
 * Converte imagens e folhas de estilo relativas da seção em Blob URLs temporárias sob demanda,
 * fornecendo método revoke() para descarte imediato da memória ao desmontar a seção.
 */
export async function resolveSectionAssets(
  container: HTMLElement | Document,
  sectionPath: string,
  loadAsset: (resolvedPath: string) => Promise<Uint8Array | null>
): Promise<SectionAssetSession> {
  const createdUrls: string[] = []

  const sectionDir = sectionPath.includes('/')
    ? sectionPath.substring(0, sectionPath.lastIndexOf('/'))
    : ''

  const resolvePath = (relative: string): string => {
    if (!relative || relative.startsWith('http://') || relative.startsWith('https://') || relative.startsWith('data:') || relative.startsWith('blob:')) {
      return ''
    }
    const clean = relative.split('#')[0]!.split('?')[0]!
    const parts = (sectionDir ? `${sectionDir}/${clean}` : clean).split('/')
    const resolved: string[] = []
    for (const p of parts) {
      if (p === '.' || !p) continue
      if (p === '..') {
        resolved.pop()
      } else {
        resolved.push(p)
      }
    }
    return resolved.join('/')
  }

  // 1. Processar <img> e SVG <image>
  const imgElements = Array.from(container.querySelectorAll<HTMLImageElement | SVGImageElement>('img, image'))
  for (const el of imgElements) {
    const rawSrc = el instanceof HTMLImageElement ? el.getAttribute('src') : (el.getAttribute('href') || el.getAttribute('xlink:href'))
    if (!rawSrc) continue

    const fullPath = resolvePath(rawSrc)
    if (!fullPath) continue

    try {
      const bytes = await loadAsset(fullPath)
      if (bytes && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const mime = getMimeType(fullPath)
        const blob = new Blob([bytes as any], { type: mime })
        const blobUrl = URL.createObjectURL(blob)
        createdUrls.push(blobUrl)

        if (el instanceof HTMLImageElement) {
          el.src = blobUrl
        } else {
          el.setAttribute('href', blobUrl)
        }
      }
    } catch {
      // Ignora falha de imagem individual
    }
  }

  return {
    blobUrls: createdUrls,
    revoke() {
      if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        for (const url of createdUrls) {
          try {
            URL.revokeObjectURL(url)
          } catch {
            /* ignorar */
          }
        }
      }
      createdUrls.length = 0
    }
  }
}
