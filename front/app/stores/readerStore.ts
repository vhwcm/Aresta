import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import type { IBookDocument } from '~/interfaces/reader/IBookDocument'

interface ReaderState {
  document: IBookDocument | null
  bookId: number | null
  currentPage: number
  isLoading: boolean
  error: string | null
  fileName: string | null
  bookmarks: number[]
  isGraphOpen: boolean
  isMobileGraphOpen: boolean
}

export const useReaderStore = defineStore('reader', {
  state: (): ReaderState => ({
    document: null,
    bookId: null,
    currentPage: 1,
    isLoading: false,
    error: null,
    fileName: null,
    bookmarks: [],
    isGraphOpen: true,
    isMobileGraphOpen: false,
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
    isCurrentPageBookmarked: (state): boolean => state.bookmarks.includes(state.currentPage),
    savedPages: (state): number[] => [...state.bookmarks].sort((a, b) => a - b),
  },

  actions: {
    setBookId(id: number | null) {
      this.bookId = id
      this.loadBookmarks()
    },

    setDocument(doc: IBookDocument, fileName: string, bookId: number | null = null) {
      if (this.document) {
        try { this.document.destroy() } catch { /* ignorar */ }
      }
      this.document = markRaw(doc)
      this.fileName = fileName
      if (bookId !== null) {
        this.bookId = bookId
      }
      this.currentPage = 1
      this.isLoading = false
      this.error = null
      this.loadBookmarks()
    },

    loadBookmarks() {
      if (typeof window === 'undefined') return
      const key = this.bookId
        ? `aresta_bookmarks_${this.bookId}`
        : (this.fileName ? `aresta_bookmarks_${this.fileName}` : null)
      if (!key) {
        this.bookmarks = []
        return
      }
      try {
        const raw = localStorage.getItem(key)
        if (raw) {
          const parsed = JSON.parse(raw)
          this.bookmarks = Array.isArray(parsed) ? parsed : []
        } else {
          this.bookmarks = []
        }
      } catch {
        this.bookmarks = []
      }
    },

    saveBookmarks() {
      if (typeof window === 'undefined') return
      const key = this.bookId
        ? `aresta_bookmarks_${this.bookId}`
        : (this.fileName ? `aresta_bookmarks_${this.fileName}` : null)
      if (!key) return
      try {
        localStorage.setItem(key, JSON.stringify(this.bookmarks))
      } catch {
        /* ignorar */
      }
    },

    toggleBookmark(pageNumber?: number) {
      const page = pageNumber ?? this.currentPage
      if (this.bookmarks.includes(page)) {
        this.bookmarks = this.bookmarks.filter((p) => p !== page)
      } else {
        this.bookmarks = [...this.bookmarks, page].sort((a, b) => a - b)
      }
      this.saveBookmarks()
    },

    addBookmark(pageNumber: number) {
      if (!this.bookmarks.includes(pageNumber)) {
        this.bookmarks = [...this.bookmarks, pageNumber].sort((a, b) => a - b)
        this.saveBookmarks()
      }
    },

    removeBookmark(pageNumber: number) {
      this.bookmarks = this.bookmarks.filter((p) => p !== pageNumber)
      this.saveBookmarks()
    },

    toggleGraph() {
      this.isGraphOpen = !this.isGraphOpen
    },

    setGraphOpen(open: boolean) {
      this.isGraphOpen = open
    },

    toggleMobileGraph() {
      this.isMobileGraphOpen = !this.isMobileGraphOpen
    },

    setMobileGraphOpen(open: boolean) {
      this.isMobileGraphOpen = open
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
      this.bookId = null
      this.currentPage = 1
      this.isLoading = false
      this.error = null
      this.fileName = null
      this.bookmarks = []
      this.isMobileGraphOpen = false
    },
  },
})
