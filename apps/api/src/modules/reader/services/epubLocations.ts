import { unzipSync, strFromU8 } from 'fflate'

export interface EpubLocationsResult {
  totalLocations: number
  locationsPerSection: number[]
}

const LOCATION_SIZE = 1024

/**
 * Remove tags HTML/XML e decodifica entidades básicas para contagem fiel de caracteres de texto.
 */
export function extractTextFromHtml(html: string): string {
  if (!html) return ''
  // Remove scripts, styles e comentários
  const clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove tags XML/HTML
    .replace(/<[^>]+>/g, '')
    // Decodifica entidades comuns
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))

  return clean
}

/**
 * Extrai contagem de caracteres por seção e total de localizações de um buffer de EPUB.
 */
export function extractEpubLocations(epubBuffer: Uint8Array): EpubLocationsResult {
  const unzipped = unzipSync(epubBuffer)

  // 1. Encontrar o container.xml
  const containerKey = Object.keys(unzipped).find(k => k.toLowerCase() === 'meta-inf/container.xml')
  if (!containerKey) {
    return { totalLocations: 1, locationsPerSection: [] }
  }

  const containerXml = strFromU8(unzipped[containerKey]!)
  const rootfileMatch = containerXml.match(/full-path=["']([^"']+)["']/i)
  if (!rootfileMatch || !rootfileMatch[1]) {
    return { totalLocations: 1, locationsPerSection: [] }
  }

  const opfPath = rootfileMatch[1].replace(/\\/g, '/')
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/')) : ''

  // 2. Encontrar o OPF
  const opfKey = Object.keys(unzipped).find(k => k.toLowerCase() === opfPath.toLowerCase())
  if (!opfKey) {
    return { totalLocations: 1, locationsPerSection: [] }
  }

  const opfContent = strFromU8(unzipped[opfKey]!)

  // 3. Mapear Manifest
  const manifestMap = new Map<string, string>()
  const itemRegex = /<item\b[^>]*\bid=["']([^"']+)["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = itemRegex.exec(opfContent)) !== null) {
    const id = match[1]!
    const href = match[2]!
    manifestMap.set(id, href)
  }

  // Se a regex acima não capturou por ordem inversa de atributos:
  if (manifestMap.size === 0) {
    const fallbackItemRegex = /<item\b([^>]+)>/gi
    while ((match = fallbackItemRegex.exec(opfContent)) !== null) {
      const attrs = match[1]!
      const idM = attrs.match(/\bid=["']([^"']+)["']/i)
      const hrefM = attrs.match(/\bhref=["']([^"']+)["']/i)
      if (idM && hrefM && idM[1] && hrefM[1]) {
        manifestMap.set(idM[1], hrefM[1])
      }
    }
  }

  // 4. Ler Spine
  const spineMatches = opfContent.match(/<itemref\b[^>]*\bidref=["']([^"']+)["'][^>]*>/gi) || []
  const locationsPerSection: number[] = []
  let totalChars = 0

  for (const itemref of spineMatches) {
    const idrefMatch = itemref.match(/\bidref=["']([^"']+)["']/i)
    if (!idrefMatch || !idrefMatch[1]) continue
    const idref = idrefMatch[1]
    const relativeHref = manifestMap.get(idref)
    if (!relativeHref) continue

    // Resolver caminho dentro do ZIP
    const cleanHref = relativeHref.split('#')[0]!.split('?')[0]!
    const resolvedPath = opfDir ? `${opfDir}/${cleanHref}` : cleanHref
    const normalizedPath = resolvedPath.replace(/^\/+/, '')

    const sectionKey = Object.keys(unzipped).find(
      k => k.toLowerCase() === normalizedPath.toLowerCase()
    )

    let charCount = 0
    if (sectionKey && unzipped[sectionKey]) {
      const xhtmlContent = strFromU8(unzipped[sectionKey]!)
      const text = extractTextFromHtml(xhtmlContent)
      charCount = text.length
    }

    locationsPerSection.push(charCount)
    totalChars += charCount
  }

  const totalLocations = totalChars > 0 ? Math.max(1, Math.ceil(totalChars / LOCATION_SIZE)) : 1

  return {
    totalLocations,
    locationsPerSection
  }
}
