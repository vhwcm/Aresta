import { ref } from 'vue'
import { createBookDocument } from '~/adapters/BookDocumentFactory'
import { getBinaryStorage } from '~/adapters/storage/StorageManager'
import { saveCachedBook } from '~/utils/bookCache'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { CoverExtractorFactory } from '~/adapters/cover/CoverExtractorFactory'
import { useGoogleDriveSync, type GoogleDriveSyncResult } from './useGoogleDriveSync'
import { useAuth } from './useAuth'
import type { IBookDocument } from '~/interfaces/reader/IBookDocument'
import type { SupportedFileType } from '~/interfaces/reader/IValidationResult'
import type { LocalBook } from '~/adapters/database/types'
import type { ExtractedCoverResult } from '~/adapters/cover/ICoverExtractor'

export interface UploadLocalBookOptions {
  file: File | Blob
  type: SupportedFileType
  fileName?: string
  customTitle?: string
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
  const auth = useAuth()

  const uploadBookLocally = async (options: UploadLocalBookOptions): Promise<UploadLocalBookResult> => {
    isUploading.value = true
    uploadError.value = null

    try {
      const { file, type, initialFontSize, initialFontFamily, customTitle } = options
      const rawFileName = options.fileName || (file instanceof File ? file.name : 'livro')
      const fileNameWithoutExt = rawFileName.replace(/\.[^/.]+$/, '')

      // 1. Carrega o documento para parsing e extração de metadados
      const doc = createBookDocument(type)
      const loadPayload = file instanceof File ? file : await file.arrayBuffer()
      await doc.load(loadPayload, rawFileName, initialFontSize, initialFontFamily)

      const rawTitle = customTitle?.trim() || fileNameWithoutExt
      const title = rawTitle.slice(0, 30)
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
      let localBook = await bookRepo.save({
        id: bookId,
        bookId,
        title,
        author,
        coverPath: coverUrl,
        filePath: savedPath || `${bookId}.${type}`,
        status: 'LENDO',
        currentPage: 1,
      })

      let finalBookId = bookId

      // 6.1 Se o usuário estiver autenticado, persiste o livro na conta do usuário no backend
      if (auth.isLoggedIn.value) {
        try {
          let apiBase = 'http://localhost:3001/api'
          if (typeof useRuntimeConfig === 'function') {
            try {
              const cfg = useRuntimeConfig()
              if (cfg?.public?.apiUrl) {
                apiBase = `${cfg.public.apiUrl}/api`
              }
            } catch {}
          }

          const res = await $fetch<any>(`${apiBase}/user-books`, {
            method: 'POST',
            headers: auth.token.value ? { Authorization: `Bearer ${auth.token.value}` } : {},
            body: {
              title,
              author,
              coverPath: coverUrl,
              filePath: savedPath || `${bookId}.${type}`,
              fileType: type,
              status: 'LENDO',
              currentPage: 1,
            },
          })

          const remoteUserBook = res?.userBook
          const realBookId = remoteUserBook?.book_id || remoteUserBook?.bookId
          const realUserBookId = remoteUserBook?.id || remoteUserBook?.userBookId

          if (realBookId && realUserBookId) {
            finalBookId = realBookId

            // Remove o ID temporário local para prevenir duplicatas na estante
            if (bookId !== realUserBookId && bookId !== realBookId) {
              try {
                await bookRepo.delete(bookId)
              } catch (delErr) {
                console.warn('[useLocalBookUpload] Aviso ao deletar ID temporário:', delErr)
              }
            }

            // Atualiza com o registro oficial remoto
            localBook = await bookRepo.save({
              id: realUserBookId,
              bookId: realBookId,
              title,
              author,
              coverPath: coverUrl,
              filePath: savedPath || `${realBookId}.${type}`,
              status: 'LENDO',
              currentPage: 1,
            })

            // Espelha o binário sob a chave do realBookId no storage/cache
            try {
              await storage.saveFile(String(realBookId), arrayBuffer, mimeType)
              await saveCachedBook(String(realBookId), arrayBuffer, title, type)
            } catch (mirrorErr) {
              console.warn('[useLocalBookUpload] Aviso ao espelhar cache binário:', mirrorErr)
            }
          }
        } catch (apiErr) {
          console.warn('[useLocalBookUpload] Falha ao registrar livro no backend do usuário:', apiErr)
        }
      }

      // 7. Sincronização com o Google Drive (Aresta/[Título]/) se conta vinculada ou usuário autenticado
      let cloudSyncPromise: Promise<GoogleDriveSyncResult> | undefined
      if (isGoogleDriveConnected.value || auth.isLoggedIn.value) {
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
        bookId: finalBookId,
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
