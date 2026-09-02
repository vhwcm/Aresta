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
          <h2 class="reader-shell__empty-title">Nenhum livro carregado</h2>
          <p class="reader-shell__empty-desc">
            O módulo de leitura é dedicado à visualização de obras. Escolha um livro na biblioteca ou envie um novo arquivo.
          </p>
          <p v-if="store.error" class="reader-shell__empty-error" role="alert">
            {{ store.error }}
          </p>
          <div class="reader-shell__empty-actions">
            <NuxtLink to="/library" class="reader-shell__btn reader-shell__btn--primary">
              <BookOpenIcon class="w-4 h-4" />
              <span>Ver Biblioteca</span>
            </NuxtLink>
            <NuxtLink to="/upload" class="reader-shell__btn reader-shell__btn--secondary">
              <UploadIcon class="w-4 h-4" />
              <span>Enviar Arquivo</span>
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
import { createBookDocument } from '~/adapters/BookDocumentFactory'

import { readerProfiler } from '~/utils/readerProfiler'
import { getCachedBook, saveCachedBook } from '~/utils/bookCache'
import { getBinaryStorage } from '~/adapters/storage/StorageManager'
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

const loadingLabel = computed(() =>
  store.documentType === 'epub' ? 'EPUB' : 'PDF',
)

function resolveBookFileUrl(bookId?: string, bookPath?: string): string {
  if (bookId) return `http://localhost:7070/api/books/${bookId}/file`
  if (!bookPath) return ''
  if (bookPath.startsWith('http://') || bookPath.startsWith('https://')) return bookPath
  const cleanPath = bookPath.replace(/^\//, '')
  if (cleanPath.startsWith('epubs/') || cleanPath.startsWith('pdfs/') || cleanPath.startsWith('storage/')) {
    return `http://localhost:7070/${cleanPath}`
  }
  const folder = cleanPath.toLowerCase().endsWith('.epub') ? 'epubs' : 'pdfs'
  return `http://localhost:7070/${folder}/${cleanPath}`
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

    // 1. Tentar carregar instantaneamente do armazenamento local (Tauri FS / OPFS / IndexedDB)
    const localBytes = await readerProfiler.measureAsync('1. Buscar no Armazenamento Local (FS/OPFS/IndexedDB)', async () => {
      const storage = getBinaryStorage()
      const direct = await storage.getFile(cacheKey)
      if (direct && direct.byteLength > 0) return direct
      const cached = await getCachedBook(cacheKey)
      return cached?.arrayBuffer || null
    }, 'io')

    if (localBytes && localBytes.byteLength > 0) {
      arrayBuffer = localBytes
      type = detectFileTypeFromArrayBuffer(localBytes, 'epub')
    } else {
      // 2. Se não estiver no cache, preparar URLs e paralelizar requisições
      const fileUrl = resolveBookFileUrl(bookId, bookPath)

      // Paralelização de Metadados + Download do Binário
      const [fetchedMeta, response] = await readerProfiler.measureAsync(
        '2. Download do Arquivo & Metadados em Paralelo (HTTP Fetch)',
        async () => {
          const metaPromise = bookId
            ? $fetch<{ title?: string; filePath?: string }>(`http://localhost:7070/api/books/${bookId}`).catch(() => null)
            : Promise.resolve(null)

          const filePromise = fetch(fileUrl).then((res) => {
            if (!res.ok) throw new Error(`Status HTTP ${res.status} ao carregar arquivo`)
            return res
          })

          return await Promise.all([metaPromise, filePromise])
        },
        'network',
        { url: fileUrl },
      )

      if (fetchedMeta && fetchedMeta.title) {
        title = fetchedMeta.title
      }

      arrayBuffer = await readerProfiler.measureAsync('3. Conversão para ArrayBuffer em Memória', async () => {
        return await response.arrayBuffer()
      }, 'io', { byteLength: response.headers.get('content-length') })

      // Detectar formato com prioridade: formatType -> Content-Type -> filePath -> magic bytes
      const contentType = response.headers.get('content-type') || ''
      let fallbackType: 'pdf' | 'epub' | 'didactic' = 'epub'
      
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
      void saveCachedBook(cacheKey, arrayBuffer, title, type as 'pdf' | 'epub')
    }

    store.syncSettings()
    const doc = createBookDocument(type)
    const numericBookId = bookId ? parseInt(bookId, 10) : null
    const validBookId = numericBookId !== null && !isNaN(numericBookId) ? numericBookId : null
    const coverUrl = validBookId ? `http://localhost:7070/api/books/${validBookId}/cover` : undefined

    await readerProfiler.measureAsync('4. Parsing e Inicialização do Documento', async () => {
      await doc.load(arrayBuffer!, title, store.fontSize, store.fontFamily, coverUrl)
    }, 'parse', { type, sizeMB: (arrayBuffer!.byteLength / (1024 * 1024)).toFixed(2) })

    readerProfiler.measureSync('5. Atualizar ReaderStore', () => {
      store.setDocument(doc, title, validBookId)

      if (pageParam) {
        const pageNum = parseInt(pageParam, 10)
        if (!isNaN(pageNum) && pageNum > 0) {
          store.goToPage(pageNum)
        }
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
