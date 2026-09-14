import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import type { IBookDocument } from '~/interfaces/reader/IBookDocument'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'

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
  isNotesOpen: boolean
  isMobileNotesOpen: boolean
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
      isNotesOpen: defaultGraphOpen,
      isMobileNotesOpen: false,
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
          if (parsed.readerTheme === 'white' || parsed.readerTheme === 'sepia' || parsed.readerTheme === 'black') {
            this.readerTheme = parsed.readerTheme
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

    getBookStorageKey(): string | null {
      if (this.bookId) return `aresta_book_${this.bookId}`
      if (this.fileName) return `aresta_book_${this.fileName}`
      return null
    },

    loadBookTypography() {
      if (typeof window === 'undefined') return
      const key = this.getBookStorageKey()
      if (!key) {
        this.fontSize = 18
        this.fontFamily = "'Newsreader', Georgia, serif"
        return
      }

      try {
        let savedSize = localStorage.getItem(`${key}_fontsize`)
        if (savedSize === null && this.fileName) {
          savedSize = localStorage.getItem(`aresta_book_${this.fileName}_fontsize`)
        }
        if (savedSize !== null) {
          const parsed = Number(savedSize)
          if (!isNaN(parsed)) {
            this.fontSize = Math.max(12, Math.min(36, Math.round(parsed)))
          }
        } else {
          this.fontSize = 18
        }

        let savedFont = localStorage.getItem(`${key}_fontfamily`)
        if (!savedFont && this.fileName) {
          savedFont = localStorage.getItem(`aresta_book_${this.fileName}_fontfamily`)
        }
        if (savedFont) {
          const fontMap: Record<string, string> = {
            newsreader: "'Newsreader', Georgia, serif",
            literata: "'Literata', Georgia, serif",
            lora: "'Lora', Georgia, serif",
            merriweather: "'Merriweather', Georgia, serif",
            inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }
          this.fontFamily = fontMap[savedFont] || savedFont
        } else {
          this.fontFamily = "'Newsreader', Georgia, serif"
        }
      } catch {
        this.fontSize = 18
        this.fontFamily = "'Newsreader', Georgia, serif"
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
      this.bookId = bookId
      this.currentPage = 1
      this.isLoading = false
      this.error = null
      this.isGraphOpen = false
      this.isMobileGraphOpen = false
      this.syncSettings()
      this.loadBookTypography()
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
          const key = this.getBookStorageKey()
          if (key) {
            localStorage.setItem(`${key}_fontfamily`, family)
          }
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
          const key = this.getBookStorageKey()
          if (key) {
            localStorage.setItem(`${key}_fontsize`, String(clamped))
          }
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

    toggleNotes() {
      this.isNotesOpen = !this.isNotesOpen
      this.isGraphOpen = this.isNotesOpen
    },

    setNotesOpen(open: boolean) {
      this.isNotesOpen = open
      this.isGraphOpen = open
    },

    toggleMobileNotes() {
      this.isMobileNotesOpen = !this.isMobileNotesOpen
      this.isMobileGraphOpen = this.isMobileNotesOpen
    },

    setMobileNotesOpen(open: boolean) {
      this.isMobileNotesOpen = open
      this.isMobileGraphOpen = open
    },

    toggleGraph() {
      this.toggleNotes()
    },

    setGraphOpen(open: boolean) {
      this.setNotesOpen(open)
    },

    toggleMobileGraph() {
      this.toggleMobileNotes()
    },

    setMobileGraphOpen(open: boolean) {
      this.setMobileNotesOpen(open)
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
      const mode = theme === 'sepia' ? 'sepia' : (theme === 'white' ? 'light' : 'dark')
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aresta_reader_theme', theme)
          const saved = localStorage.getItem('aresta_settings')
          const settings = saved ? JSON.parse(saved) : {}
          settings.readerTheme = theme
          settings.themeMode = mode
          localStorage.setItem('aresta_settings', JSON.stringify(settings))

          const root = document.documentElement
          const body = document.body
          root.setAttribute('data-theme', mode)
          root.classList.remove('light-theme', 'dark-theme', 'sepia-theme', 'dark')
          root.classList.add(`${mode}-theme`)
          if (mode === 'dark') {
            root.classList.add('dark')
          }
          if (body) {
            body.classList.remove('light-theme', 'dark-theme', 'sepia-theme', 'dark')
            body.classList.add(`${mode}-theme`)
            if (mode === 'dark') {
              body.classList.add('dark')
            }
          }
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
      if (this.bookId) {
        void this.persistProgress(clamped)
      }
    },

    async persistProgress(page: number) {
      if (!this.bookId) return
      const nowIso = new Date().toISOString()
      try {
        let existing = await bookRepo.getById(this.bookId)
        if (!existing) {
          const all = await bookRepo.getAll()
          existing = all.find(b => b.bookId === this.bookId || b.id === this.bookId) || null
        }
        if (existing) {
          await bookRepo.save({
            ...existing,
            currentPage: page,
            lastAccessedAt: nowIso
          })
        }
      } catch (e) {
        // Silencioso em caso de erro local
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aresta_last_accessed_book_id', String(this.bookId))
          localStorage.setItem('aresta_last_accessed_at', nowIso)
        } catch {}
      }

      // Sincroniza em background com o backend se autenticado
      try {
        const config = typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : null
        const apiUrl = config?.public?.apiUrl || 'http://localhost:3001'
        const cookieToken = typeof useCookie === 'function' ? useCookie<string | null>('aresta_token').value : null
        const authData = typeof window !== 'undefined' ? (localStorage.getItem('aresta_token') || localStorage.getItem('auth_token')) : null
        const token = cookieToken || (authData ? (authData.startsWith('"') ? JSON.parse(authData) : authData) : null)
        if (token && typeof fetch !== 'undefined') {
          fetch(`${apiUrl}/api/user-books/${this.bookId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPage: page })
          }).catch(() => {})
        }
      } catch {}
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
      this.isNotesOpen = false
      this.isMobileNotesOpen = false
      this.isGraphOpen = false
      this.isMobileGraphOpen = false
      this.isZenMode = false
    },
  },
})
