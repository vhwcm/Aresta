<template>
  <div
    class="reader-shell"
    :class="'reader-shell--' + activeTheme"
    :data-theme="activeTheme === 'sepia' ? 'sepia' : (activeTheme === 'white' ? 'light' : 'dark')"
    :style="{ backgroundColor: themeBgColor }"
  >
    <transition name="fade" mode="out-in">
      <ReaderViewer v-if="store.hasDocument" key="reader" />
    </transition>

    <div
      v-if="store.isLoading"
      class="reader-shell__global-loading"
      role="status"
      aria-live="polite"
      aria-label="Carregando livro"
    >
      <div class="reader-shell__global-spinner" />
      <p>Carregando {{ loadingLabel }}...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReaderStore } from '~/stores/readerStore'
import { useUserBooks } from '~/composables/useUserBooks'
import { useAuth } from '~/composables/useAuth'
import { useGoogleDriveSync } from '~/composables/useGoogleDriveSync'
import { createBookDocument } from '~/adapters/BookDocumentFactory'

import { readerProfiler } from '~/utils/readerProfiler'
import { getCachedBook, saveCachedBook } from '~/utils/bookCache'
import { getBinaryStorage } from '~/adapters/storage/StorageManager'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { detectFileTypeFromArrayBuffer } from '~/utils/fileValidator'
import { getApiRoot } from '~/utils/apiBase'
import { getCoverUrl } from '~/utils/cover'
import type { SupportedFileType } from '~/interfaces/reader/IValidationResult'

const store = useReaderStore()
const route = useRoute()
const router = useRouter()
const auth = useAuth()

const activeTheme = computed(() => store.readerTheme || 'sepia')
const themeBgColor = computed(() => {
  if (activeTheme.value === 'white') return '#ffffff'
  if (activeTheme.value === 'black') return '#000000'
  return '#f5eedc'
})

const loadingLabel = computed(() => {
  if (store.documentType === 'didactic') return 'Livreto Didático IA'
  return store.documentType === 'epub' ? 'EPUB' : 'PDF'
})

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = auth.token.value || (typeof useCookie === 'function' ? useCookie<string | null>('aresta_token').value : null)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

function resolveBookFileUrl(bookId?: string, bookPath?: string): string {
  const readerApi = getApiRoot()
  if (bookId) return `${readerApi}/api/books/${bookId}/file`
  if (!bookPath) return ''
  if (bookPath.startsWith('http://') || bookPath.startsWith('https://')) return bookPath
  const cleanPath = bookPath.replace(/^\//, '')
  if (cleanPath.startsWith('books/') || cleanPath.startsWith('epubs/') || cleanPath.startsWith('pdfs/')) {
    return `/${cleanPath}`
  }
  if (cleanPath.startsWith('storage/')) {
    return `${readerApi}/${cleanPath}`
  }
  const folder = cleanPath.toLowerCase().endsWith('.pdf') ? 'pdfs' : 'epubs'
  return `/${folder}/${cleanPath}`
}

async function fetchBookMetadata(bookId: string) {
  try {
    const readerApi = getApiRoot()
    const headers = getAuthHeaders()
    const metaRes = await fetch(`${readerApi}/api/books/${bookId}`, { headers })
    return metaRes.ok ? await metaRes.json() : null
  } catch (e) {
    console.warn('[ReaderShell] Falha ao buscar metadados do livro:', e)
    return null
  }
}

const loadBookFromQuery = async () => {
  const bookId = route.query.bookId as string | undefined
  const bookPath = route.query.book as string | undefined
  const pageParam = route.query.page as string | undefined

  if (!bookId && !bookPath) {
    void router.replace('/')
    return
  }

  const cacheKey = bookId || bookPath || ''
  const sessionName = `Abrir Livro (${bookId ? `ID: ${bookId}` : bookPath})`
  readerProfiler.startSession(sessionName, { bookId, bookPath, pageParam })

  store.setLoading(true)
  try {
    let title = (route.query.title as string) || 'Livro'
    let arrayBuffer: ArrayBuffer | null = null
    let type: SupportedFileType = 'epub'

    // Consultar metadados no repositório local (Local-First: SQLite / Dexie)
    const numericBookId = bookId ? parseInt(bookId, 10) : null
    const validBookId = numericBookId !== null && !isNaN(numericBookId) ? numericBookId : null
    let localBookMeta: any = null
    if (validBookId) {
      try {
        localBookMeta = await bookRepo.getById(validBookId)
        if (!localBookMeta) {
          const all = await bookRepo.getAll()
          localBookMeta = all.find(b => b.bookId === validBookId || b.id === validBookId) || null
        }
        if (localBookMeta?.title && (!route.query.title || route.query.title === 'Livro')) {
          title = localBookMeta.title
        }
      } catch (e) {
        console.warn('[ReaderShell] Erro ao buscar livro no repositório local:', e)
      }
    }

    // 1. Tentar carregar instantaneamente do armazenamento local (Tauri FS / OPFS / IndexedDB)
    let cachedType: SupportedFileType | null = null
    let cachedTitle: string | null = null
    const localBytes = await readerProfiler.measureAsync('1. Buscar no Armazenamento Local (FS/OPFS/IndexedDB)', async () => {
      const storage = getBinaryStorage()
      let direct = await storage.getFile(cacheKey)
      if (!direct && localBookMeta?.filePath) {
        direct = await storage.getFile(localBookMeta.filePath)
      }
      const cached = await getCachedBook(cacheKey)
      if (cached) {
        cachedType = cached.type
        cachedTitle = cached.title
      }
      if (direct && direct.byteLength > 0) return direct
      return cached?.arrayBuffer || null
    }, 'io')

    if (localBytes && localBytes.byteLength > 0) {
      arrayBuffer = localBytes
      if (cachedTitle && (!title || title === 'Livro')) {
        title = cachedTitle
      }
      const metaAny = localBookMeta as any
      if (
        cachedType === 'didactic' ||
        metaAny?.format_type === 'DIDACTIC' ||
        metaAny?.formatType === 'DIDACTIC' ||
        metaAny?.is_ai_generated ||
        metaAny?.isAiGenerated ||
        metaAny?.fileType === 'didactic' ||
        metaAny?.filePath?.includes('didactic') ||
        (bookPath && bookPath.includes('didactic'))
      ) {
        type = 'didactic'
      } else if (
        localBookMeta?.filePath?.toLowerCase().endsWith('.pdf') ||
        (bookPath && bookPath.toLowerCase().endsWith('.pdf')) ||
        cachedType === 'pdf'
      ) {
        type = 'pdf'
      } else if (cachedType === 'epub') {
        type = 'epub'
      } else {
        type = detectFileTypeFromArrayBuffer(localBytes, 'epub')
      }
    } else {
      // 2. Tentar baixar do Google Drive se conectado ou for livro sincronizado
      const { isGoogleDriveConnected, downloadBookFromDrive } = useGoogleDriveSync()
      const folderId = localBookMeta?.filePath?.startsWith('drive:')
        ? localBookMeta.filePath.replace('drive:', '')
        : undefined
      const searchTitle = localBookMeta?.title || (route.query.title as string) || ''

      if (isGoogleDriveConnected.value || folderId) {
        try {
          const driveRes = await readerProfiler.measureAsync('2. Download do Livro do Google Drive', async () => {
            return await downloadBookFromDrive({ folderId, bookTitle: searchTitle })
          }, 'network')

          if (driveRes && driveRes.blob) {
            arrayBuffer = await driveRes.blob.arrayBuffer()
            const mime = driveRes.mimeType || ''
            if (mime.includes('pdf') || driveRes.fileName.toLowerCase().endsWith('.pdf')) {
              type = 'pdf'
            } else if (mime.includes('json') || driveRes.fileName.toLowerCase().endsWith('.json')) {
              type = 'didactic'
            } else {
              type = detectFileTypeFromArrayBuffer(arrayBuffer, 'epub')
            }

            // Salvar capa se fornecida ou extrair do arquivo binário e atualizar stores
            if (localBookMeta && !localBookMeta.coverPath) {
              if (driveRes.coverBlob) {
                try {
                  const reader = new FileReader()
                  reader.readAsDataURL(driveRes.coverBlob)
                  reader.onloadend = async () => {
                    const coverDataUrl = reader.result as string
                    if (coverDataUrl && localBookMeta) {
                      localBookMeta.coverPath = coverDataUrl
                      await bookRepo.save(localBookMeta).catch(() => {})
                      try {
                        const { useUserBooks } = await import('~/composables/useUserBooks')
                        const { userBooks } = useUserBooks()
                        const target = userBooks.value.find((b) => b.bookId === localBookMeta.id || b.bookId === localBookMeta.bookId)
                        if (target) target.coverPath = coverDataUrl
                      } catch {}
                    }
                  }
                } catch {}
              } else if (type === 'epub' || type === 'pdf') {
                try {
                  const { CoverExtractorFactory } = await import('~/adapters/cover/CoverExtractorFactory')
                  const extractor = CoverExtractorFactory.getExtractor(type)
                  if (extractor) {
                    extractor.extractCover(arrayBuffer, driveRes.fileName).then(async (res) => {
                      if (res?.dataUrl && localBookMeta) {
                        localBookMeta.coverPath = res.dataUrl
                        await bookRepo.save(localBookMeta).catch(() => {})
                        try {
                          const { useUserBooks } = await import('~/composables/useUserBooks')
                          const { userBooks } = useUserBooks()
                          const target = userBooks.value.find((b) => b.bookId === localBookMeta.id || b.bookId === localBookMeta.bookId)
                          if (target) target.coverPath = res.dataUrl
                        } catch {}
                      }
                    }).catch(() => {})
                  }
                } catch {}
              }
            }

            // Salvar no armazenamento local para futuras leituras offline
            const mimeToSave = mime || (type === 'pdf' ? 'application/pdf' : 'application/epub+zip')
            void getBinaryStorage().saveFile(cacheKey, arrayBuffer, mimeToSave)
            void saveCachedBook(cacheKey, arrayBuffer, title, type)
          }
        } catch (driveErr) {
          console.warn('[ReaderShell] Erro ao baixar livro do Google Drive:', driveErr)
        }
      }

      // 3. Se ainda não temos o arquivo, buscar da API / Servidor
      if (!arrayBuffer) {
        const fileUrl = resolveBookFileUrl(bookId, bookPath)
        const headers = getAuthHeaders()
        let response: Response
        try {
          response = await readerProfiler.measureAsync('3. Network Fetch do Arquivo', async () => {
            return await fetch(fileUrl, { headers })
          }, 'network')
        } catch (fetchErr: any) {
          if (localBookMeta || folderId) {
            throw new Error(
              'Não foi possível carregar o arquivo do livro. Este livro foi importado em outro dispositivo e não está disponível localmente nem no Google Drive. Conecte sua conta do Google Drive ou envie o arquivo novamente neste dispositivo.'
            )
          }
          throw fetchErr
        }

        if (!response.ok) {
          if (response.status === 404 && (localBookMeta || folderId)) {
            throw new Error(
              'Não foi possível encontrar o arquivo do livro. Este livro foi importado em outro dispositivo e ainda não foi sincronizado localmente. Conecte sua conta do Google Drive para baixar seus livros em múltiplos dispositivos ou envie o arquivo novamente.'
            )
          }
          throw new Error(`Falha ao baixar livro (HTTP ${response.status})`)
        }

        // Buscar metadados do livro da API caso tenhamos bookId
        const fetchedMeta = bookId ? await fetchBookMetadata(bookId) : null

        if (fetchedMeta?.title) {
          title = fetchedMeta.title
        }

        arrayBuffer = await readerProfiler.measureAsync('4. Conversão para ArrayBuffer em Memória', async () => {
          return await response.arrayBuffer()
        }, 'io', { byteLength: response.headers.get('content-length') })

        // Detectar formato com prioridade: formatType -> Content-Type -> filePath -> magic bytes
        const contentType = response.headers.get('content-type') || ''
        let fallbackType: SupportedFileType = 'epub'

        const metaAny = fetchedMeta as any
        if (metaAny?.format_type === 'DIDACTIC' || metaAny?.formatType === 'DIDACTIC' || metaAny?.is_ai_generated || metaAny?.isAiGenerated) {
          fallbackType = 'didactic'
          type = 'didactic'
        } else if (contentType.includes('application/pdf')) {
          fallbackType = 'pdf'
          type = detectFileTypeFromArrayBuffer(arrayBuffer, fallbackType)
        } else if (contentType.includes('application/epub+zip')) {
          fallbackType = 'epub'
          type = detectFileTypeFromArrayBuffer(arrayBuffer, fallbackType)
        } else if (contentType.includes('application/json')) {
          fallbackType = 'didactic'
          type = 'didactic'
        } else if (fetchedMeta?.filePath) {
          fallbackType = fetchedMeta.filePath.toLowerCase().endsWith('.pdf') ? 'pdf' : (fetchedMeta.filePath.includes('didactic') ? 'didactic' : 'epub')
          type = fallbackType === 'didactic' ? 'didactic' : detectFileTypeFromArrayBuffer(arrayBuffer, fallbackType)
        } else if (bookPath) {
          fallbackType = bookPath.toLowerCase().endsWith('.pdf') ? 'pdf' : (bookPath.includes('didactic') ? 'didactic' : 'epub')
          type = fallbackType === 'didactic' ? 'didactic' : detectFileTypeFromArrayBuffer(arrayBuffer, fallbackType)
        } else {
          type = detectFileTypeFromArrayBuffer(arrayBuffer, fallbackType)
        }

        // Salvar em background no storage manager / IndexedDB para as próximas aberturas serem instantâneas
        const mimeToSave = contentType || (type === 'pdf' ? 'application/pdf' : (type === 'didactic' ? 'application/json' : 'application/epub+zip'))
        void getBinaryStorage().saveFile(cacheKey, arrayBuffer, mimeToSave)
        void saveCachedBook(cacheKey, arrayBuffer, title, type)
      }
    }

    store.syncSettings()
    const doc = createBookDocument(type)
    const coverUrl = localBookMeta?.coverPath || (validBookId ? getCoverUrl(undefined, Number(validBookId)) : undefined)

    await readerProfiler.measureAsync('4. Parsing e Inicialização do Documento', async () => {
      await doc.load(arrayBuffer!, title, store.fontSize, store.fontFamily, coverUrl)
    }, 'parse', { type, sizeMB: (arrayBuffer!.byteLength / (1024 * 1024)).toFixed(2) })

    readerProfiler.measureSync('5. Atualizar ReaderStore', () => {
      store.setDocument(doc, doc.metadata?.title || title, validBookId)

      const targetPage = pageParam
        ? parseInt(pageParam, 10)
        : (localBookMeta?.currentPage && localBookMeta.currentPage > 0 ? localBookMeta.currentPage : null)

      if (targetPage && !isNaN(targetPage) && targetPage > 0) {
        store.goToPage(targetPage)
      } else if (validBookId) {
        void store.persistProgress(localBookMeta?.currentPage || 1)
      }

      if (validBookId) {
        try {
          const { recordBookAccess } = useUserBooks()
          void recordBookAccess(validBookId)
        } catch {}
      }
    }, 'store')
  } catch (err: any) {
    console.error('Erro ao carregar livro via URL:', err)
    store.setError(`Não foi possível carregar o livro: ${err.message || err}`)
    readerProfiler.endSession()
  } finally {
    store.setLoading(false)
  }
}

onMounted(() => {
  store.setGraphOpen(false)
  store.setMobileGraphOpen(false)
  if (!route.query.bookId && !route.query.book && !store.hasDocument) {
    void router.replace('/')
    return
  }
  if (!store.hasDocument || (route.query.bookId && String(store.bookId) !== String(route.query.bookId))) {
    void loadBookFromQuery()
  }
})

watch(
  () => [route.query.bookId, route.query.book],
  ([newId, newPath], [oldId, oldPath]) => {
    if ((newId && newId !== oldId) || (newPath && newPath !== oldPath)) {
      void loadBookFromQuery()
    } else if (!newId && !newPath && !store.hasDocument) {
      void router.replace('/')
    }
  }
)

watch(
  () => [store.hasDocument, store.isLoading],
  ([hasDoc, isLoading]) => {
    if (!hasDoc && !isLoading && !route.query.bookId && !route.query.book) {
      void router.replace('/')
    }
  }
)
</script>

<style scoped>
.reader-shell {
  position: relative;
  width: 100%;
  height: 100dvh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s ease;
}

.reader-shell--sepia {
  background-color: #f5eedc;
}

.reader-shell--white {
  background-color: #ffffff;
}

.reader-shell--black {
  background-color: #000000;
}



.reader-shell__global-loading {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 14, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 100;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.reader-shell__global-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(124, 106, 247, 0.2);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
