import { ref } from 'vue'
import { createBookDocument } from '~/adapters/BookDocumentFactory'
import { getBinaryStorage } from '~/adapters/storage/StorageManager'
import { saveCachedBook } from '~/utils/bookCache'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import type { IBookDocument } from '~/interfaces/reader/IBookDocument'
import type { SupportedFileType } from '~/interfaces/reader/IValidationResult'
import type { LocalBook } from '~/adapters/database/types'

export interface UploadLocalBookOptions {
  file: File | Blob
  type: SupportedFileType
  fileName?: string
  initialFontSize?: number
  initialFontFamily?: string
}

export interface UploadLocalBookResult {
  bookId: number
  title: string
  author: string
  doc: IBookDocument
  localBook: LocalBook
  arrayBuffer: ArrayBuffer
}

export const useLocalBookUpload = () => {
  const isUploading = ref(false)
  const uploadError = ref<string | null>(null)

  const uploadBookLocally = async (options: UploadLocalBookOptions): Promise<UploadLocalBookResult> => {
    isUploading.value = true
    uploadError.value = null

    try {
      const { file, type, initialFontSize, initialFontFamily } = options
      const rawFileName = options.fileName || (file instanceof File ? file.name : 'livro')

      // 1. Carrega o documento para parsing e extração de metadados (título, autor, capa)
      const doc = createBookDocument(type)
      const loadPayload = file instanceof File ? file : await file.arrayBuffer()
      await doc.load(loadPayload, rawFileName, initialFontSize, initialFontFamily)

      const title = doc.metadata?.title?.trim() || rawFileName.replace(/\.[^/.]+$/, '')
      const author = doc.metadata?.author?.trim() || 'Autor Desconhecido'
      const coverUrl = doc.metadata?.coverUrl || ''

      // 2. Extrai os bytes binários do arquivo
      const arrayBuffer = await file.arrayBuffer()

      // 3. Gera ID único numérico (compatível com SQLite INTEGER PRIMARY KEY e Dexie)
      const bookId = Date.now()
      const storageKey = String(bookId)
      const mimeType = type === 'pdf' ? 'application/pdf' : 'application/epub+zip'

      // 4. Salva o binário no armazenamento local (Tauri FS em Desktop/Android, OPFS/IndexedDB na Web)
      const storage = getBinaryStorage()
      let savedPath = ''
      try {
        savedPath = await storage.saveFile(storageKey, arrayBuffer, mimeType)
      } catch (storageErr) {
        console.warn('[useLocalBookUpload] Aviso ao salvar no storage adapter primário:', storageErr)
      }

      // Garante redundância no cache IndexedDB
      try {
        await saveCachedBook(storageKey, arrayBuffer, title, type)
      } catch (cacheErr) {
        console.warn('[useLocalBookUpload] Aviso ao salvar no cache IndexedDB:', cacheErr)
      }

      // 5. Salva no banco de dados local (Tauri SQLite / Dexie / InMemory)
      const localBook = await bookRepo.save({
        id: bookId,
        bookId,
        title,
        author,
        coverPath: coverUrl,
        filePath: savedPath || `${bookId}.${type}`,
        status: 'LENDO',
        currentPage: 1,
      })

      return {
        bookId,
        title,
        author,
        doc,
        localBook,
        arrayBuffer,
      }
    } catch (err: any) {
      console.error('[useLocalBookUpload] Erro durante upload local do livro:', err)
      const msg = err?.message || 'Falha ao salvar o livro no banco de dados local.'
      uploadError.value = msg
      throw err
    } finally {
      isUploading.value = false
    }
  }

  return {
    isUploading,
    uploadError,
    uploadBookLocally,
  }
}
