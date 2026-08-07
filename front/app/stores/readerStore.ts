import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import type { IBookDocument } from '~/interfaces/reader/IBookDocument'

interface ReaderState {
  document: IBookDocument | null
  currentPage: number
  isLoading: boolean
  error: string | null
  fileName: string | null
}

export const useReaderStore = defineStore('reader', {
  state: (): ReaderState => ({
    document: null,
    currentPage: 1,
    isLoading: false,
    error: null,
    fileName: null,
  }),

  getters: {
    totalPages: (state): number => state.document?.totalPages ?? 0,
    hasDocument: (state): boolean => state.document !== null,
    isFirstPage: (state): boolean => state.currentPage <= 1,
    isLastPage: (state): boolean =>
      state.document !== null && state.currentPage >= state.document.totalPages,
    documentType: (state) => state.document?.type ?? null,
    title: (state) => state.document?.metadata.title ?? state.fileName ?? '',
    canGoNext: (state): boolean =>
      state.document !== null && state.currentPage < state.document.totalPages,
    canGoPrev: (state): boolean => state.currentPage > 1,
  },

  actions: {
    setDocument(doc: IBookDocument, fileName: string) {
      if (this.document) {
        try { this.document.destroy() } catch { /* ignorar */ }
      }
      this.document = markRaw(doc)
      this.fileName = fileName
      this.currentPage = 1
      this.isLoading = false
      this.error = null
    },

    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setError(message: string) {
      this.error = message
      this.isLoading = false
    },

    goToPage(page: number) {
      if (!this.document) return
      const clamped = Math.max(1, Math.min(page, this.document.totalPages))
      this.currentPage = clamped
    },

    nextPage() {
      this.goToPage(this.currentPage + 1)
    },

    prevPage() {
      this.goToPage(this.currentPage - 1)
    },

    reset() {
      if (this.document) {
        try { this.document.destroy() } catch { /* ignorar */ }
      }
      this.document = null
      this.currentPage = 1
      this.isLoading = false
      this.error = null
      this.fileName = null
    },
  },
})
