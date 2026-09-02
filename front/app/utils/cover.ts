export const getCoverUrl = (coverPath?: string, bookId?: number) => {
  if (bookId) {
    return `http://localhost:7070/api/books/${bookId}/cover`
  }
  if (!coverPath) return ''
  if (coverPath.startsWith('http://') || coverPath.startsWith('https://')) {
    return coverPath
  }
  const fileName = coverPath.replace(/^storage\/covers\//, '').replace(/^storage\//, '')
  return `http://localhost:7070/covers/${fileName}`
}

export type BookFormat = 'EPUB' | 'PDF' | 'DIDACTIC'

export const getBookFormat = (filePath?: string | null): BookFormat => {
  if (!filePath) return 'EPUB'
  const lower = filePath.toLowerCase()
  if (lower.includes('didactic') || lower.startsWith('virtual://didactic')) {
    return 'DIDACTIC'
  }
  if (lower.endsWith('.pdf') || lower.includes('/pdfs/') || lower.includes('.pdf?')) {
    return 'PDF'
  }
  return 'EPUB'
}

