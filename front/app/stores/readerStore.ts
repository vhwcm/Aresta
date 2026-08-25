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
  isTwoPageMode: boolean
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
    isTwoPageMode: false,
  }),

  getters: {
    totalPages: (state): number => state.document?.totalPages ?? 0,
    hasDocument: (state): boolean => state.document !== null,
    isFirstPage: (state): boolean => state.currentPage <= 1,
    isLastPage: (state): boolean => {
      if (!state.document) return false
      return state.isTwoPageMode
        ? state.currentPage + 1 >= state.document.totalPages
        : state.currentPage >= state.document.totalPages
    },
    documentType: (state) => state.document?.type ?? null,
    title: (state) => state.document?.metadata.title ?? state.fileName ?? '',
    canGoNext: (state): boolean => {
      if (!state.document) return false
      return state.isTwoPageMode
        ? state.currentPage + 1 < state.document.totalPages
        : state.currentPage < state.document.totalPages
    },
    canGoPrev: (state): boolean => state.currentPage > 1,
    secondPage: (state): number | null => {
      if (!state.isTwoPageMode || !state.document) return null
      const second = state.currentPage + 1
      return second <= state.document.totalPages ? second : null
    },
    isCurrentPageBookmarked: (state): boolean => {
      if (state.isTwoPageMode) {
        const second = state.currentPage + 1
        const total = state.document?.totalPages ?? 0
        return state.bookmarks.includes(state.currentPage) || (second <= total && state.bookmarks.includes(second))
      }
      return state.bookmarks.includes(state.currentPage)
    },
    savedPages: (state): number[] => [...state.bookmarks].sort((a, b) => a - b),
    progressPercentage: (state): number => {
      if (!state.document || state.document.totalPages <= 0) return 0
      const pageForProgress = state.isTwoPageMode
        ? Math.min(state.currentPage + 1, state.document.totalPages)
        : state.currentPage
      return Math.round((pageForProgress / state.document.totalPages) * 100)
    },
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
      if (this.isTwoPageMode && pageNumber === undefined) {
        const second = this.currentPage + 1
        const total = this.document?.totalPages ?? 0
        const isCurrentMarked = this.bookmarks.includes(this.currentPage)
        const isSecondMarked = second <= total && this.bookmarks.includes(second)

        if (isCurrentMarked || isSecondMarked) {
          this.bookmarks = this.bookmarks.filter((p) => p !== this.currentPage && p !== second)
        } else {
          this.bookmarks = [...this.bookmarks, this.currentPage].sort((a, b) => a - b)
        }
      } else {
        if (this.bookmarks.includes(page)) {
          this.bookmarks = this.bookmarks.filter((p) => p !== page)
        } else {
          this.bookmarks = [...this.bookmarks, page].sort((a, b) => a - b)
        }
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

    setTwoPageMode(enabled: boolean) {
      this.isTwoPageMode = enabled
      if (enabled && this.currentPage > 1 && this.currentPage % 2 === 0) {
        this.currentPage = this.currentPage - 1
      }
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
      let clamped = Math.max(1, Math.min(page, this.document.totalPages))
      if (this.isTwoPageMode && clamped > 1 && clamped % 2 === 0) {
        clamped = clamped - 1
      }
      this.currentPage = clamped
    },

    nextPage() {
      if (this.canGoNext) {
        const step = this.isTwoPageMode ? 2 : 1
        this.goToPage(this.currentPage + step)
      }
    },

    prevPage() {
      if (this.canGoPrev) {
        const step = this.isTwoPageMode ? 2 : 1
        this.goToPage(Math.max(1, this.currentPage - step))
      }
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
      this.isTwoPageMode = false
    },
  },
})
