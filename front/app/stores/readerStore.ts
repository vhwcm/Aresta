import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import type { IBookDocument } from '~/interfaces/reader/IBookDocument'

export type ReaderColorTheme = 'sepia' | 'white' | 'black'
export type ReaderWidthMode = 'centered' | 'wide'

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
  readerWidthMode: ReaderWidthMode
  isZenMode: boolean
  fontSize: number
  fontFamily: string
  readerTheme: ReaderColorTheme
}

export const useReaderStore = defineStore('reader', {
  state: (): ReaderState => {
    const defaultGraphOpen = false
    let defaultTwoPageMode = true
    let defaultWidthMode: ReaderWidthMode = 'centered'
    let defaultFontSize = 18
    let defaultFontFamily = "'Newsreader', Georgia, serif"
    let defaultReaderTheme: ReaderColorTheme = 'sepia'

    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('aresta_reader_theme')
        if (savedTheme === 'white' || savedTheme === 'sepia' || savedTheme === 'black') {
          defaultReaderTheme = savedTheme
        }

        const savedWidthMode = localStorage.getItem('aresta_reader_width_mode')
        if (savedWidthMode === 'centered' || savedWidthMode === 'wide') {
          defaultWidthMode = savedWidthMode
        }

        const savedTwoPage = localStorage.getItem('aresta_reader_two_page')
        if (savedTwoPage !== null) {
          defaultTwoPageMode = savedTwoPage === 'true'
        }

        const saved = localStorage.getItem('aresta_settings')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (typeof parsed.readerTwoPageMode === 'boolean') {
            defaultTwoPageMode = parsed.readerTwoPageMode
          }
          if (parsed.readerWidthMode === 'centered' || parsed.readerWidthMode === 'wide') {
            defaultWidthMode = parsed.readerWidthMode
          }
          if (typeof parsed.epubFontSize === 'number') {
            defaultFontSize = Math.max(12, Math.min(36, Math.round(parsed.epubFontSize)))
          }
          if (parsed.readerTheme === 'white' || parsed.readerTheme === 'sepia' || parsed.readerTheme === 'black') {
            defaultReaderTheme = parsed.readerTheme
          }
          if (parsed.epubFontFamily) {
            const fontMap: Record<string, string> = {
              newsreader: "'Newsreader', Georgia, serif",
              literata: "'Literata', Georgia, serif",
              lora: "'Lora', Georgia, serif",
              merriweather: "'Merriweather', Georgia, serif",
              inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }
            if (fontMap[parsed.epubFontFamily]) {
              defaultFontFamily = fontMap[parsed.epubFontFamily]!
            }
          }
        }
      } catch {
        // ignorar falha de parse
      }
    }

    return {
      document: null,
      bookId: null,
      currentPage: 1,
      isLoading: false,
      error: null,
      fileName: null,
      bookmarks: [],
      isGraphOpen: defaultGraphOpen,
      isMobileGraphOpen: false,
      isTwoPageMode: defaultTwoPageMode,
      readerWidthMode: defaultWidthMode,
      isZenMode: false,
      fontSize: defaultFontSize,
      fontFamily: defaultFontFamily,
      readerTheme: defaultReaderTheme,
    }
  },

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
    progressPercentage: (state): number => {
      if (!state.document || state.document.totalPages <= 0) return 0
      return Math.round((state.currentPage / state.document.totalPages) * 100)
    },
  },

  actions: {
    syncSettings() {
      if (typeof window === 'undefined') return
      try {
        const saved = localStorage.getItem('aresta_settings')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (typeof parsed.readerTwoPageMode === 'boolean') {
            this.isTwoPageMode = parsed.readerTwoPageMode
          }
          if (parsed.readerWidthMode === 'centered' || parsed.readerWidthMode === 'wide') {
            this.readerWidthMode = parsed.readerWidthMode
          }
          if (typeof parsed.epubFontSize === 'number') {
            const parsedSize = Math.max(12, Math.min(36, Math.round(parsed.epubFontSize)))
            this.fontSize = parsedSize
            if (this.document && typeof this.document.setFontSize === 'function') {
              this.document.setFontSize(parsedSize, this.currentPage)
            }
          }
          if (parsed.readerTheme === 'white' || parsed.readerTheme === 'sepia' || parsed.readerTheme === 'black') {
            this.readerTheme = parsed.readerTheme
          }
          if (parsed.epubFontFamily) {
            const fontMap: Record<string, string> = {
              newsreader: "'Newsreader', Georgia, serif",
              literata: "'Literata', Georgia, serif",
              lora: "'Lora', Georgia, serif",
              merriweather: "'Merriweather', Georgia, serif",
              inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }
            if (fontMap[parsed.epubFontFamily]) {
              const fontFam = fontMap[parsed.epubFontFamily]!
              this.fontFamily = fontFam
              if (this.document && typeof this.document.setFontFamily === 'function') {
                this.document.setFontFamily(fontFam, this.currentPage)
              }
            }
          }
        }
        const savedTheme = localStorage.getItem('aresta_reader_theme')
        if (savedTheme === 'white' || savedTheme === 'sepia' || savedTheme === 'black') {
          this.readerTheme = savedTheme
        }
        const savedWidthMode = localStorage.getItem('aresta_reader_width_mode')
        if (savedWidthMode === 'centered' || savedWidthMode === 'wide') {
          this.readerWidthMode = savedWidthMode
        }
        const savedTwoPage = localStorage.getItem('aresta_reader_two_page')
        if (savedTwoPage !== null) {
          this.isTwoPageMode = savedTwoPage === 'true'
        }
      } catch {
        // ignorar falha de parse
      }
    },

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
      this.isGraphOpen = false
      this.isMobileGraphOpen = false
      this.syncSettings()
      if (doc.type === 'epub') {
        if (typeof doc.setFontSize === 'function') {
          const preferredSize = this.fontSize || 18
          doc.setFontSize(preferredSize, 1)
        }
        if (typeof doc.setFontFamily === 'function') {
          const preferredFont = this.fontFamily || "'Newsreader', Georgia, serif"
          doc.setFontFamily(preferredFont, 1)
        }
      }
      this.loadBookmarks()
    },

    setFontFamily(family: string) {
      if (!family) return
      this.fontFamily = family
      if (typeof window !== 'undefined') {
        try {
          const fontMapRev: Record<string, string> = {
            "'Newsreader', Georgia, serif": 'newsreader',
            "'Literata', Georgia, serif": 'literata',
            "'Lora', Georgia, serif": 'lora',
            "'Merriweather', Georgia, serif": 'merriweather',
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif": 'inter',
          }
          const fontId = fontMapRev[family]
          const saved = localStorage.getItem('aresta_settings')
          const settings = saved ? JSON.parse(saved) : {}
          if (fontId) {
            settings.epubFontFamily = fontId
            localStorage.setItem('aresta_reader_font', fontId)
          }
          localStorage.setItem('aresta_settings', JSON.stringify(settings))
        } catch {
          // ignorar erro
        }
      }
      if (this.document && typeof this.document.setFontFamily === 'function') {
        const newPage = this.document.setFontFamily(family, this.currentPage)
        this.currentPage = Math.max(1, Math.min(newPage, this.document.totalPages))
      }
    },

    setFontSize(size: number) {
      const clamped = Math.max(12, Math.min(36, Math.round(size)))
      this.fontSize = clamped
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('aresta_settings')
          const settings = saved ? JSON.parse(saved) : {}
          settings.epubFontSize = clamped
          localStorage.setItem('aresta_settings', JSON.stringify(settings))
        } catch {
          // ignorar erro
        }
      }
      if (this.document && typeof this.document.setFontSize === 'function') {
        const newPage = this.document.setFontSize(clamped, this.currentPage)
        this.currentPage = Math.max(1, Math.min(newPage, this.document.totalPages))
      }
    },

    increaseFontSize(step = 2) {
      this.setFontSize(this.fontSize + step)
    },

    decreaseFontSize(step = 2) {
      this.setFontSize(this.fontSize - step)
    },

    resetFontSize() {
      this.setFontSize(18)
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

    setTwoPageMode(isTwoPage: boolean) {
      this.isTwoPageMode = isTwoPage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aresta_reader_two_page', String(isTwoPage))
          const saved = localStorage.getItem('aresta_settings')
          const settings = saved ? JSON.parse(saved) : {}
          settings.readerTwoPageMode = isTwoPage
          localStorage.setItem('aresta_settings', JSON.stringify(settings))
        } catch {
          // ignorar erro
        }
      }
    },

    toggleTwoPageMode() {
      this.setTwoPageMode(!this.isTwoPageMode)
    },

    setReaderWidthMode(mode: ReaderWidthMode) {
      if (mode !== 'centered' && mode !== 'wide') return
      this.readerWidthMode = mode
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aresta_reader_width_mode', mode)
          const saved = localStorage.getItem('aresta_settings')
          const settings = saved ? JSON.parse(saved) : {}
          settings.readerWidthMode = mode
          localStorage.setItem('aresta_settings', JSON.stringify(settings))
        } catch {
          // ignorar erro
        }
      }
    },

    toggleReaderWidthMode() {
      this.setReaderWidthMode(this.readerWidthMode === 'centered' ? 'wide' : 'centered')
    },

    setReaderTheme(theme: ReaderColorTheme) {
      if (theme !== 'white' && theme !== 'sepia' && theme !== 'black') return
      this.readerTheme = theme
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aresta_reader_theme', theme)
          const saved = localStorage.getItem('aresta_settings')
          const settings = saved ? JSON.parse(saved) : {}
          settings.readerTheme = theme
          localStorage.setItem('aresta_settings', JSON.stringify(settings))
        } catch {
          // ignorar erro
        }
      }
    },

    setZenMode(zen: boolean) {
      this.isZenMode = zen
    },

    toggleZenMode() {
      this.isZenMode = !this.isZenMode
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

    setCurrentPage(page: number) {
      this.goToPage(page)
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
      this.isGraphOpen = false
      this.isMobileGraphOpen = false
      this.isZenMode = false
    },
  },
})
