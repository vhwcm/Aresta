import { reactive, computed, readonly } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useReaderStore, type ReaderColorTheme, type ReaderWidthMode } from '~/stores/readerStore'

function trySyncReaderStore() {
  if (typeof window === 'undefined') return
  try {
    const store = useReaderStore()
    store.syncSettings()
  } catch {
    // pinia não inicializado ou SSR
  }
}

export type ThemeMode = 'dark' | 'light' | 'sepia'
export type EpubFontFamilyId = 'newsreader' | 'literata' | 'lora' | 'merriweather' | 'inter'
export type DictionaryLanguage = 'pt-BR' | 'pt' | 'en' | 'es'

export interface SettingsState {
  pageAnimationEnabled: boolean
  pageCreaseEnabled: boolean
  language: string
  nativeLanguage: DictionaryLanguage | string
  targetTranslationLanguage: DictionaryLanguage | string
  epubFontSize: number
  epubFontFamily: EpubFontFamilyId
  themeMode: ThemeMode
  desktopHomeGraphOpen: boolean
  desktopReaderGraphOpen: boolean
  readerTwoPageMode: boolean
  readerWidthMode: ReaderWidthMode
  readerTheme: ReaderColorTheme
}

export interface UserSettingsResponse {
  userId: number
  pageAnimationEnabled: boolean
  pageCreaseEnabled?: boolean
  language: string
  nativeLanguage?: string
  targetTranslationLanguage?: string
  epubFontSize?: number
  epubFontFamily?: EpubFontFamilyId
  themeMode?: ThemeMode
  desktopHomeGraphOpen?: boolean
  desktopReaderGraphOpen?: boolean
  readerTwoPageMode?: boolean
  readerWidthMode?: ReaderWidthMode
  readerTheme?: ReaderColorTheme
  updatedAt?: string | null
}

const API_BASE = 'http://localhost:7070/api'
const STORAGE_KEY = 'aresta_settings'

const settings = reactive<SettingsState>({
  pageAnimationEnabled: true,
  pageCreaseEnabled: true,
  language: 'pt-BR',
  nativeLanguage: 'pt-BR',
  targetTranslationLanguage: 'en',
  epubFontSize: 18,
  epubFontFamily: 'newsreader',
  themeMode: 'light',
  desktopHomeGraphOpen: false,
  desktopReaderGraphOpen: false,
  readerTwoPageMode: true,
  readerWidthMode: 'centered',
  readerTheme: 'sepia',
})

let isInitialized = false

export function resetSettingsForTesting() {
  settings.pageAnimationEnabled = true
  settings.pageCreaseEnabled = true
  settings.language = 'pt-BR'
  settings.nativeLanguage = 'pt-BR'
  settings.targetTranslationLanguage = 'en'
  settings.epubFontSize = 18
  settings.epubFontFamily = 'newsreader'
  settings.themeMode = 'light'
  settings.desktopHomeGraphOpen = false
  settings.desktopReaderGraphOpen = false
  settings.readerTwoPageMode = true
  settings.readerWidthMode = 'centered'
  settings.readerTheme = 'sepia'
  isInitialized = false
}

export function applyTheme(mode: ThemeMode) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
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
}

function initSettings() {
  if (isInitialized || typeof window === 'undefined') return
  isInitialized = true
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (typeof parsed.pageAnimationEnabled === 'boolean') {
        settings.pageAnimationEnabled = parsed.pageAnimationEnabled
      }
      if (typeof parsed.pageCreaseEnabled === 'boolean') {
        settings.pageCreaseEnabled = parsed.pageCreaseEnabled
      }
      if (!settings.pageAnimationEnabled) {
        settings.pageCreaseEnabled = false
      }
      if (typeof parsed.language === 'string') {
        settings.language = parsed.language
      }
      if (typeof parsed.nativeLanguage === 'string') {
        settings.nativeLanguage = parsed.nativeLanguage
      }
      if (typeof parsed.targetTranslationLanguage === 'string') {
        settings.targetTranslationLanguage = parsed.targetTranslationLanguage
      }
      if (typeof parsed.epubFontSize === 'number') {
        settings.epubFontSize = Math.max(12, Math.min(36, Math.round(parsed.epubFontSize)))
      }
      if (typeof parsed.epubFontFamily === 'string' && ['newsreader', 'literata', 'lora', 'merriweather', 'inter'].includes(parsed.epubFontFamily)) {
        settings.epubFontFamily = parsed.epubFontFamily
      }
      if (parsed.themeMode === 'dark' || parsed.themeMode === 'light' || parsed.themeMode === 'sepia') {
        settings.themeMode = parsed.themeMode
      }
      if (parsed.readerTheme === 'white' || parsed.readerTheme === 'sepia' || parsed.readerTheme === 'black') {
        settings.readerTheme = parsed.readerTheme
      }
      if (typeof parsed.desktopHomeGraphOpen === 'boolean') {
        settings.desktopHomeGraphOpen = parsed.desktopHomeGraphOpen
      }
      if (typeof parsed.desktopReaderGraphOpen === 'boolean') {
        settings.desktopReaderGraphOpen = parsed.desktopReaderGraphOpen
      }
      if (typeof parsed.readerTwoPageMode === 'boolean') {
        settings.readerTwoPageMode = parsed.readerTwoPageMode
      }
      if (parsed.readerWidthMode === 'centered' || parsed.readerWidthMode === 'wide') {
        settings.readerWidthMode = parsed.readerWidthMode
      }
    }

    const legacyReaderTheme = localStorage.getItem('aresta_reader_theme')
    if (legacyReaderTheme === 'white' || legacyReaderTheme === 'sepia' || legacyReaderTheme === 'black') {
      settings.readerTheme = legacyReaderTheme as ReaderColorTheme
    }

    const legacyTwoPage = localStorage.getItem('aresta_reader_two_page')
    if (legacyTwoPage !== null) {
      settings.readerTwoPageMode = legacyTwoPage === 'true'
    }

    const legacyWidthMode = localStorage.getItem('aresta_reader_width_mode')
    if (legacyWidthMode === 'centered' || legacyWidthMode === 'wide') {
      settings.readerWidthMode = legacyWidthMode
    }

    // Compatibilidade retroativa com chave antiga do grafo home
    const legacyGraphCollapsed = localStorage.getItem('aresta_home_graph_collapsed')
    if (legacyGraphCollapsed !== null && saved && JSON.parse(saved).desktopHomeGraphOpen === undefined) {
      settings.desktopHomeGraphOpen = legacyGraphCollapsed !== 'true'
    }

    // Compatibilidade retroativa com chave antiga de fonte do reader
    const legacyFont = localStorage.getItem('aresta_reader_font')
    if (legacyFont && saved && JSON.parse(saved).epubFontFamily === undefined) {
      if (['newsreader', 'literata', 'lora', 'merriweather', 'inter'].includes(legacyFont)) {
        settings.epubFontFamily = legacyFont as EpubFontFamilyId
      }
    }
  } catch {
    // ignorar falha de parse
  }

  applyTheme(settings.themeMode)
}

function applyServerSettings(data: UserSettingsResponse) {
  if (typeof data.pageAnimationEnabled === 'boolean') {
    settings.pageAnimationEnabled = data.pageAnimationEnabled
  }
  if (typeof data.pageCreaseEnabled === 'boolean') {
    settings.pageCreaseEnabled = data.pageCreaseEnabled
  }
  if (!settings.pageAnimationEnabled) {
    settings.pageCreaseEnabled = false
  }
  if (typeof data.language === 'string') {
    settings.language = data.language
  }
  if (typeof data.nativeLanguage === 'string') {
    settings.nativeLanguage = data.nativeLanguage
  }
  if (typeof data.targetTranslationLanguage === 'string') {
    settings.targetTranslationLanguage = data.targetTranslationLanguage
  }
  if (typeof data.epubFontSize === 'number') {
    settings.epubFontSize = Math.max(12, Math.min(36, Math.round(data.epubFontSize)))
  }
  if (data.epubFontFamily && ['newsreader', 'literata', 'lora', 'merriweather', 'inter'].includes(data.epubFontFamily)) {
    settings.epubFontFamily = data.epubFontFamily
  }
  if (data.themeMode === 'dark' || data.themeMode === 'light' || data.themeMode === 'sepia') {
    settings.themeMode = data.themeMode
  }
  if (typeof data.desktopHomeGraphOpen === 'boolean') {
    settings.desktopHomeGraphOpen = data.desktopHomeGraphOpen
  }
  if (typeof data.desktopReaderGraphOpen === 'boolean') {
    settings.desktopReaderGraphOpen = data.desktopReaderGraphOpen
  }
  if (typeof data.readerTwoPageMode === 'boolean') {
    settings.readerTwoPageMode = data.readerTwoPageMode
  }
  if (data.readerWidthMode === 'centered' || data.readerWidthMode === 'wide') {
    settings.readerWidthMode = data.readerWidthMode
  }

  applyTheme(settings.themeMode)
  trySyncReaderStore()
}

export function useSettings() {
  initSettings()

  const auth = useAuth()

  const saveLocally = () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      // Sincronizar chave legada para compatibilidade de leitor
      localStorage.setItem('aresta_reader_font', settings.epubFontFamily)
      localStorage.setItem('aresta_reader_page_crease', String(settings.pageCreaseEnabled))
      localStorage.setItem('aresta_home_graph_collapsed', String(!settings.desktopHomeGraphOpen))
      trySyncReaderStore()
    } catch {
      // localStorage indisponível
    }
  }

  const persistToServer = async () => {
    if (!auth.token?.value) return
    try {
      await $fetch(`${API_BASE}/user-settings`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${auth.token.value}` },
        body: {
          pageAnimationEnabled: settings.pageAnimationEnabled,
          pageCreaseEnabled: settings.pageCreaseEnabled,
          language: settings.language,
          nativeLanguage: settings.nativeLanguage,
          targetTranslationLanguage: settings.targetTranslationLanguage,
          epubFontSize: settings.epubFontSize,
          epubFontFamily: settings.epubFontFamily,
          themeMode: settings.themeMode,
          desktopHomeGraphOpen: settings.desktopHomeGraphOpen,
          desktopReaderGraphOpen: settings.desktopReaderGraphOpen,
        },
      })
    } catch {
      // silencioso se a requisição falhar
    }
  }

  const loadFromServer = async () => {
    if (!auth.token?.value) return
    try {
      const data = await $fetch<UserSettingsResponse>(`${API_BASE}/user-settings`, {
        headers: { Authorization: `Bearer ${auth.token.value}` },
      })
      if (data) {
        applyServerSettings(data)
        saveLocally()
      }
    } catch {
      // silencioso se a requisição falhar
    }
  }

  const setPageAnimationEnabled = (enabled: boolean) => {
    settings.pageAnimationEnabled = enabled
    if (!enabled) {
      settings.pageCreaseEnabled = false
    }
    saveLocally()
    void persistToServer()
  }

  const setPageCreaseEnabled = (enabled: boolean) => {
    if (enabled && !settings.pageAnimationEnabled) {
      return
    }
    settings.pageCreaseEnabled = enabled
    saveLocally()
    void persistToServer()
  }

  const setLanguage = (lang: string) => {
    settings.language = lang
    saveLocally()
    void persistToServer()
  }

  const setNativeLanguage = (lang: DictionaryLanguage | string) => {
    settings.nativeLanguage = lang
    saveLocally()
    void persistToServer()
  }

  const setTargetTranslationLanguage = (lang: DictionaryLanguage | string) => {
    settings.targetTranslationLanguage = lang
    saveLocally()
    void persistToServer()
  }

  const setEpubFontSize = (size: number) => {
    settings.epubFontSize = Math.max(12, Math.min(36, Math.round(size)))
    saveLocally()
    void persistToServer()
  }

  const setEpubFontFamily = (family: EpubFontFamilyId) => {
    settings.epubFontFamily = family
    saveLocally()
    void persistToServer()
  }

  const setThemeMode = (mode: ThemeMode) => {
    settings.themeMode = mode
    applyTheme(mode)
    saveLocally()
    void persistToServer()
  }

  const setDesktopHomeGraphOpen = (open: boolean) => {
    settings.desktopHomeGraphOpen = open
    saveLocally()
    void persistToServer()
  }

  const setReaderTheme = (theme: ReaderColorTheme) => {
    if (theme === 'white' || theme === 'sepia' || theme === 'black') {
      settings.readerTheme = theme
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aresta_reader_theme', theme)
        } catch {
          // ignorar erro
        }
      }
      saveLocally()
      void persistToServer()
    }
  }

  const toggleThemeMode = () => {
    if (settings.themeMode === 'dark') {
      setThemeMode('light')
    } else if (settings.themeMode === 'light') {
      setThemeMode('sepia')
    } else {
      setThemeMode('dark')
    }
  }

  const pageAnimationEnabled = computed({
    get: () => settings.pageAnimationEnabled,
    set: (val: boolean) => setPageAnimationEnabled(val),
  })

  const pageCreaseEnabled = computed({
    get: () => settings.pageAnimationEnabled && settings.pageCreaseEnabled,
    set: (val: boolean) => setPageCreaseEnabled(val),
  })

  const canEnablePageCrease = computed(() => settings.pageAnimationEnabled)

  const language = computed({
    get: () => settings.language,
    set: (val: string) => setLanguage(val),
  })

  const nativeLanguage = computed({
    get: () => settings.nativeLanguage,
    set: (val: string) => setNativeLanguage(val),
  })

  const targetTranslationLanguage = computed({
    get: () => settings.targetTranslationLanguage,
    set: (val: string) => setTargetTranslationLanguage(val),
  })

  const epubFontSize = computed({
    get: () => settings.epubFontSize,
    set: (val: number) => setEpubFontSize(val),
  })

  const epubFontFamily = computed({
    get: () => settings.epubFontFamily,
    set: (val: EpubFontFamilyId) => setEpubFontFamily(val),
  })

  const themeMode = computed({
    get: () => settings.themeMode,
    set: (val: ThemeMode) => setThemeMode(val),
  })

  const readerTheme = computed({
    get: () => settings.readerTheme,
    set: (val: ReaderColorTheme) => setReaderTheme(val),
  })

  const desktopHomeGraphOpen = computed({
    get: () => settings.desktopHomeGraphOpen,
    set: (val: boolean) => setDesktopHomeGraphOpen(val),
  })

  return {
    settings: readonly(settings),
    pageAnimationEnabled,
    pageCreaseEnabled,
    canEnablePageCrease,
    language,
    nativeLanguage,
    targetTranslationLanguage,
    epubFontSize,
    epubFontFamily,
    themeMode,
    readerTheme,
    desktopHomeGraphOpen,
    setPageAnimationEnabled,
    setPageCreaseEnabled,
    setLanguage,
    setNativeLanguage,
    setTargetTranslationLanguage,
    setEpubFontSize,
    setEpubFontFamily,
    setThemeMode,
    setReaderTheme,
    toggleThemeMode,
    setDesktopHomeGraphOpen,
    loadFromServer,
  }
}
