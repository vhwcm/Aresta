import { ref } from 'vue'
import { createBookDocument } from '~/adapters/BookDocumentFactory'
import { getBinaryStorage } from '~/adapters/storage/StorageManager'
import { saveCachedBook } from '~/utils/bookCache'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { CoverExtractorFactory } from '~/adapters/cover/CoverExtractorFactory'
import { useGoogleDriveSync, type GoogleDriveSyncResult } from './useGoogleDriveSync'
import type { IBookDocument } from '~/interfaces/reader/IBookDocument'
import type { SupportedFileType } from '~/interfaces/reader/IValidationResult'
import type { LocalBook } from '~/adapters/database/types'
import type { ExtractedCoverResult } from '~/adapters/cover/ICoverExtractor'

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
  extractedCover?: ExtractedCoverResult | null
  cloudSyncPromise?: Promise<GoogleDriveSyncResult>
}

export const useLocalBookUpload = () => {
  const isUploading = ref(false)
  const uploadError = ref<string | null>(null)
  const { syncBookToDrive, isGoogleDriveConnected } = useGoogleDriveSync()

  const uploadBookLocally = async (options: UploadLocalBookOptions): Promise<UploadLocalBookResult> => {
    isUploading.value = true
    uploadError.value = null

    try {
      const { file, type, initialFontSize, initialFontFamily } = options
      const rawFileName = options.fileName || (file instanceof File ? file.name : 'livro')

      // 1. Carrega o documento para parsing e extração de metadados
      const doc = createBookDocument(type)
      const loadPayload = file instanceof File ? file : await file.arrayBuffer()
      await doc.load(loadPayload, rawFileName, initialFontSize, initialFontFamily)

      const title = doc.metadata?.title?.trim() || rawFileName.replace(/\.[^/.]+$/, '')
      const author = doc.metadata?.author?.trim() || 'Autor Desconhecido'
      let coverUrl = doc.metadata?.coverUrl || ''

      // 2. Extração especializada de capa via CoverExtractorFactory (SOLID)
      let extractedCover: ExtractedCoverResult | null = null
      try {
        const extractor = CoverExtractorFactory.getExtractor(type)
        if (extractor) {
          extractedCover = await extractor.extractCover(file, rawFileName)
          if (extractedCover?.dataUrl && !coverUrl) {
            coverUrl = extractedCover.dataUrl
            if (doc.metadata) {
              doc.metadata.coverUrl = coverUrl
            }
          }
        }
      } catch (coverErr) {
        console.warn('[useLocalBookUpload] Aviso ao extrair capa do livro:', coverErr)
      }

      // 3. Extrai os bytes binários do arquivo
      const arrayBuffer = await file.arrayBuffer()

      // 4. Gera ID único numérico (compatível com SQLite INTEGER PRIMARY KEY e Dexie)
      const bookId = Date.now()
      const storageKey = String(bookId)
      const mimeType = type === 'pdf' ? 'application/pdf' : 'application/epub+zip'

      // 5. Salva o binário no armazenamento local (Tauri FS em Desktop/Android, OPFS/IndexedDB na Web)
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

      // 6. Salva no banco de dados local (Tauri SQLite / Dexie / InMemory)
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

      // 7. Sincronização assíncrona com o Google Drive (Aresta/[Título]/) se conta vinculada
      let cloudSyncPromise: Promise<GoogleDriveSyncResult> | undefined
      if (isGoogleDriveConnected.value) {
        cloudSyncPromise = syncBookToDrive({
          bookTitle: title,
          bookFile: file,
          bookFileName: rawFileName.endsWith(`.${type}`) ? rawFileName : `${rawFileName}.${type}`,
          bookMimeType: mimeType,
          coverBlob: extractedCover?.blob || null,
          coverFileName: 'cover.webp',
        })
      }

      return {
        bookId,
        title,
        author,
        doc,
        localBook,
        arrayBuffer,
        extractedCover,
        cloudSyncPromise,
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
