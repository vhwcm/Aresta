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
