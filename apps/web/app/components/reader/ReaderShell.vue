<template>
  <div
    class="reader-shell"
    :class="'reader-shell--' + activeTheme"
    :data-theme="activeTheme === 'sepia' ? 'sepia' : (activeTheme === 'white' ? 'light' : 'dark')"
    :style="{ backgroundColor: themeBgColor }"
  >
    <transition name="fade" mode="out-in">
      <ReaderViewer v-if="store.hasDocument" key="reader" />
      <div v-else key="empty" class="reader-shell__empty">
        <div class="reader-shell__empty-card">
          <div class="reader-shell__empty-icon">
            <BookOpenIcon class="w-10 h-10 text-accent" />
          </div>
          <h2 class="reader-shell__empty-title">Comece uma leitura</h2>
          <p class="reader-shell__empty-desc">
            Nenhum livro foi selecionado para leitura. Escolha uma obra na sua estante ou faça o upload de um arquivo para começar.
          </p>
          <p v-if="store.error" class="reader-shell__empty-error" role="alert">
            {{ store.error }}
          </p>
          <div class="reader-shell__empty-actions">
            <NuxtLink to="/upload" class="reader-shell__btn reader-shell__btn--primary">
              <UploadIcon class="w-4 h-4" />
              <span>Comece uma leitura</span>
            </NuxtLink>
            <NuxtLink to="/library" class="reader-shell__btn reader-shell__btn--secondary">
              <BookOpenIcon class="w-4 h-4" />
              <span>Ver Biblioteca</span>
            </NuxtLink>
          </div>
        </div>
      </div>
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
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { BookOpenIcon, UploadIcon } from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'
import { useUserBooks } from '~/composables/useUserBooks'
import { createBookDocument } from '~/adapters/BookDocumentFactory'

import { readerProfiler } from '~/utils/readerProfiler'
import { getCachedBook, saveCachedBook } from '~/utils/bookCache'
import { getBinaryStorage } from '~/adapters/storage/StorageManager'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { detectFileTypeFromArrayBuffer } from '~/utils/fileValidator'
import type { SupportedFileType } from '~/interfaces/reader/IValidationResult'

const store = useReaderStore()
const route = useRoute()

const activeTheme = computed(() => store.readerTheme || 'sepia')
const themeBgColor = computed(() => {
  if (activeTheme.value === 'white') return '#ffffff'
  if (activeTheme.value === 'black') return '#121214'
  return '#f5eedc'
})

const loadingLabel = computed(() => {
  if (store.documentType === 'didactic') return 'Livreto Didático IA'
  return store.documentType === 'epub' ? 'EPUB' : 'PDF'
})

function resolveBookFileUrl(bookId?: string, bookPath?: string): string {
  const config = useRuntimeConfig()
  const readerApi = config.public.readerApiUrl || config.public.apiUrl || 'http://localhost:3001'
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
    const config = useRuntimeConfig()
    const readerApi = config.public.readerApiUrl || config.public.apiUrl || 'http://localhost:3001'
    const metaRes = await fetch(`${readerApi}/api/books/${bookId}`)
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

  if (!bookId && !bookPath) return

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
    const localBytes = await readerProfiler.measureAsync('1. Buscar no Armazenamento Local (FS/OPFS/IndexedDB)', async () => {
      const storage = getBinaryStorage()
      let direct = await storage.getFile(cacheKey)
      if (!direct && localBookMeta?.filePath) {
        direct = await storage.getFile(localBookMeta.filePath)
      }
      if (direct && direct.byteLength > 0) return direct
      const cached = await getCachedBook(cacheKey)
      return cached?.arrayBuffer || null
    }, 'io')

    if (localBytes && localBytes.byteLength > 0) {
      arrayBuffer = localBytes
      if (localBookMeta?.filePath?.toLowerCase().endsWith('.pdf') || (bookPath && bookPath.toLowerCase().endsWith('.pdf'))) {
        type = 'pdf'
      } else {
        type = detectFileTypeFromArrayBuffer(localBytes, 'epub')
      }
    } else {
      // 2. Buscar da API / Network
      const fileUrl = resolveBookFileUrl(bookId, bookPath)
      const response = await readerProfiler.measureAsync('2. Network Fetch do Arquivo', async () => {
        return await fetch(fileUrl)
      }, 'network')

      if (!response.ok) {
        throw new Error(`Falha ao baixar livro (HTTP ${response.status})`)
      }

      // Buscar metadados do livro da API caso tenhamos bookId
      const fetchedMeta = bookId ? await fetchBookMetadata(bookId) : null

      if (fetchedMeta?.title) {
        title = fetchedMeta.title
      }

      arrayBuffer = await readerProfiler.measureAsync('3. Conversão para ArrayBuffer em Memória', async () => {
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
      void getBinaryStorage().saveFile(cacheKey, arrayBuffer, contentType || (type === 'pdf' ? 'application/pdf' : 'application/epub+zip'))
      void saveCachedBook(cacheKey, arrayBuffer, title, type)
    }

    store.syncSettings()
    const doc = createBookDocument(type)
    const config = typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : null
    const readerApi = config?.public?.readerApiUrl || config?.public?.apiUrl || 'http://localhost:3001'
    const coverUrl = localBookMeta?.coverPath || (validBookId ? `${readerApi}/api/books/${validBookId}/cover` : undefined)

    await readerProfiler.measureAsync('4. Parsing e Inicialização do Documento', async () => {
      await doc.load(arrayBuffer!, title, store.fontSize, store.fontFamily, coverUrl)
    }, 'parse', { type, sizeMB: (arrayBuffer!.byteLength / (1024 * 1024)).toFixed(2) })

    readerProfiler.measureSync('5. Atualizar ReaderStore', () => {
      store.setDocument(doc, title, validBookId)

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
  if (!store.hasDocument) {
    loadBookFromQuery()
  }
})
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
  background-color: #121214;
}

.reader-shell__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 2rem;
  width: 100%;
}

.reader-shell__empty-card {
  max-width: 480px;
  width: 100%;
  background: rgba(20, 20, 28, 0.6);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.25rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.reader-shell__empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(124, 106, 247, 0.12);
  border: 1px solid rgba(124, 106, 247, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.reader-shell__empty-title {
  font-size: 1.5rem;
  font-weight: 400;
  font-family: var(--font-editorial, serif);
  color: var(--color-text-primary);
}

.reader-shell__empty-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.reader-shell__empty-error {
  color: var(--color-error);
  font-size: 0.85rem;
  padding: 0.6rem 1rem;
  background: rgba(247, 106, 106, 0.1);
  border: 1px solid rgba(247, 106, 106, 0.25);
  border-radius: 0.5rem;
  width: 100%;
}

.reader-shell__empty-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  margin-top: 0.5rem;
}

.reader-shell__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.reader-shell__btn--primary {
  background: var(--color-accent);
  color: #ffffff;
}

.reader-shell__btn--primary:hover {
  background: #6a57e3;
  transform: translateY(-1px);
}

.reader-shell__btn--secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.reader-shell__btn--secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
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
