<template>
  <div class="reader-shell">
    <transition name="fade" mode="out-in">
      <ReaderUploader v-if="!store.hasDocument" key="upload" />
      <ReaderViewer v-else key="reader" />
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
import { useReaderStore } from '~/stores/readerStore'
import { createBookDocument } from '~/adapters/BookDocumentFactory'

const store = useReaderStore()
const route = useRoute()

const loadingLabel = computed(() =>
  store.documentType === 'epub' ? 'EPUB' : 'PDF',
)

const loadBookFromQuery = async () => {
  const bookId = route.query.bookId as string | undefined
  const bookPath = route.query.book as string | undefined
  const pageParam = route.query.page as string | undefined

  if (!bookId && !bookPath) return

  store.setLoading(true)
  try {
    let fileUrl = ''
    let title = (route.query.title as string) || 'Livro'

    if (bookId) {
      fileUrl = `http://localhost:7070/api/books/${bookId}/file`
      try {
        const info = await $fetch<{ title?: string }>(`http://localhost:7070/api/books/${bookId}`)
        if (info && info.title) {
          title = info.title
        }
      } catch {
        /* fallback caso falhe metadados */
      }
    } else if (bookPath) {
      if (bookPath.startsWith('http://') || bookPath.startsWith('https://')) {
        fileUrl = bookPath
      } else {
        const cleanPath = bookPath.replace(/^\//, '')
        fileUrl = cleanPath.startsWith('storage/')
          ? `http://localhost:7070/${cleanPath}`
          : `http://localhost:7070/storage/books/${cleanPath.replace(/^storage\/books\//, '')}`
      }
    }

    const type = fileUrl.toLowerCase().endsWith('.epub') ? 'epub' : 'pdf'

    const res = await fetch(fileUrl)
    if (!res.ok) {
      throw new Error(`Status HTTP ${res.status} ao carregar arquivo`)
    }
    const arrayBuffer = await res.arrayBuffer()

    const doc = createBookDocument(type)
    await doc.load(arrayBuffer, title)
    store.setDocument(doc, title)

    if (pageParam) {
      const pageNum = parseInt(pageParam, 10)
      if (!isNaN(pageNum) && pageNum > 0) {
        store.goToPage(pageNum)
      }
    }
  } catch (err: any) {
    console.error('Erro ao carregar livro via URL:', err)
    store.setError(`Não foi possível carregar o livro: ${err.message || err}`)
  } finally {
    store.setLoading(false)
  }
}

onMounted(() => {
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
