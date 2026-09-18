/**
 * Utilitários para resolução e extração de título de notas (Local-first)
 */

export const extractTitleFromMarkdown = (content?: string | null): string | null => {
  if (!content) return null
  // Busca o primeiro cabeçalho markdown (# Título ou ## Título)
  const match = content.match(/^#+\s+(.+)$/m)
  if (match && match[1]) {
    const heading = match[1].trim().replace(/[*_`]/g, '')
    const lower = heading.toLowerCase()
    // Ignora títulos genéricos ou placeholders de template
    if (
      lower &&
      !['nova nota', 'nova anotação', 'nova anotacao', 'nota', 'sem título', 'sem titulo'].includes(lower)
    ) {
      return heading
    }
  }
  return null
}

/**
 * Resolve o título final de exibição de uma nota.
 * Se o título for vazio ou 'Nova Nota' / 'Nota sem título', tenta extrair do markdown ou retorna 'Nota'.
 */
export const resolveNoteTitle = (title?: string | null, content?: string | null): string => {
  const cleanTitle = (title || '').trim()
  const lower = cleanTitle.toLowerCase()
  if (cleanTitle && lower !== 'nova nota' && lower !== 'nota sem título' && lower !== 'sem título') {
    return cleanTitle
  }
  const extracted = extractTitleFromMarkdown(content)
  if (extracted) {
    return extracted
  }
  return 'Nota'
}
