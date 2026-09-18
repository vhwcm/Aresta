import { reactive, computed, readonly } from 'vue'
import { useReaderStore, type ReaderColorTheme, type ReaderWidthMode, type ReadingMode } from '~/stores/readerStore'
import { settingsRepo } from '~/adapters/database/repositories/SettingsRepository'

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
  readerReadingMode: ReadingMode
}

export interface UserSettingsResponse {
  userId?: number
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
  readerReadingMode?: ReadingMode
  updatedAt?: string | null
}

export function themeModeToReaderTheme(mode: ThemeMode): ReaderColorTheme {
  if (mode === 'dark') return 'black'
  if (mode === 'sepia') return 'sepia'
  return 'white'
}

export function readerThemeToThemeMode(theme: ReaderColorTheme): ThemeMode {
  if (theme === 'black') return 'dark'
  if (theme === 'sepia') return 'sepia'
  return 'light'
}

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
  desktopHomeGraphOpen: true,
  desktopReaderGraphOpen: false,
  readerTwoPageMode: true,
  readerWidthMode: 'centered',
  readerTheme: 'sepia',
  readerReadingMode: 'paginated',
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
  settings.desktopHomeGraphOpen = true
  settings.desktopReaderGraphOpen = false
  settings.readerTwoPageMode = true
  settings.readerWidthMode = 'centered'
  settings.readerTheme = 'sepia'
  settings.readerReadingMode = 'paginated'
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
    body.setAttribute('data-theme', mode)
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
      if (typeof parsed.pageAnimationEnabled === 'boolean') settings.pageAnimationEnabled = parsed.pageAnimationEnabled
      if (typeof parsed.pageCreaseEnabled === 'boolean') settings.pageCreaseEnabled = parsed.pageCreaseEnabled
      if (!settings.pageAnimationEnabled) settings.pageCreaseEnabled = false
      if (typeof parsed.language === 'string') settings.language = parsed.language
      if (typeof parsed.nativeLanguage === 'string') settings.nativeLanguage = parsed.nativeLanguage
      if (typeof parsed.targetTranslationLanguage === 'string') settings.targetTranslationLanguage = parsed.targetTranslationLanguage
      if (typeof parsed.epubFontSize === 'number') settings.epubFontSize = Math.max(12, Math.min(36, Math.round(parsed.epubFontSize)))
      if (typeof parsed.epubFontFamily === 'string' && ['newsreader', 'literata', 'lora', 'merriweather', 'inter'].includes(parsed.epubFontFamily)) {
        settings.epubFontFamily = parsed.epubFontFamily
      }
      if (parsed.themeMode === 'dark' || parsed.themeMode === 'light' || parsed.themeMode === 'sepia') {
        settings.themeMode = parsed.themeMode
      }
      if (parsed.readerTheme === 'white' || parsed.readerTheme === 'sepia' || parsed.readerTheme === 'black') {
        settings.readerTheme = parsed.readerTheme
      }
      if (typeof parsed.desktopHomeGraphOpen === 'boolean') settings.desktopHomeGraphOpen = parsed.desktopHomeGraphOpen
      if (typeof parsed.desktopReaderGraphOpen === 'boolean') settings.desktopReaderGraphOpen = parsed.desktopReaderGraphOpen
      if (typeof parsed.readerTwoPageMode === 'boolean') settings.readerTwoPageMode = parsed.readerTwoPageMode
      if (parsed.readerWidthMode === 'centered' || parsed.readerWidthMode === 'wide') settings.readerWidthMode = parsed.readerWidthMode
      if (parsed.readerReadingMode === 'paginated' || parsed.readerReadingMode === 'scroll') settings.readerReadingMode = parsed.readerReadingMode
    }

    // Carrega em paralelo do banco local
    settingsRepo.get().then((dbSettings) => {
      if (dbSettings) {
        if (typeof dbSettings.pageAnimationEnabled === 'boolean') settings.pageAnimationEnabled = dbSettings.pageAnimationEnabled
        if (typeof dbSettings.pageCreaseEnabled === 'boolean') settings.pageCreaseEnabled = dbSettings.pageCreaseEnabled
        if (typeof dbSettings.language === 'string') settings.language = dbSettings.language
        if (typeof dbSettings.nativeLanguage === 'string') settings.nativeLanguage = dbSettings.nativeLanguage
        if (typeof dbSettings.targetTranslationLanguage === 'string') settings.targetTranslationLanguage = dbSettings.targetTranslationLanguage
        if (typeof dbSettings.epubFontSize === 'number') settings.epubFontSize = dbSettings.epubFontSize
        if (dbSettings.epubFontFamily) settings.epubFontFamily = dbSettings.epubFontFamily as EpubFontFamilyId
        if (dbSettings.themeMode) settings.themeMode = dbSettings.themeMode as ThemeMode
        if (dbSettings.readerTheme) settings.readerTheme = dbSettings.readerTheme as ReaderColorTheme
        if (typeof dbSettings.desktopHomeGraphOpen === 'boolean') settings.desktopHomeGraphOpen = dbSettings.desktopHomeGraphOpen
        if (typeof dbSettings.desktopReaderGraphOpen === 'boolean') settings.desktopReaderGraphOpen = dbSettings.desktopReaderGraphOpen
        if (typeof dbSettings.readerTwoPageMode === 'boolean') settings.readerTwoPageMode = dbSettings.readerTwoPageMode
        if (dbSettings.readerWidthMode) settings.readerWidthMode = dbSettings.readerWidthMode as ReaderWidthMode
        if (dbSettings.readerReadingMode) settings.readerReadingMode = dbSettings.readerReadingMode as ReadingMode
        applyTheme(settings.themeMode)
        trySyncReaderStore()
      }
    }).catch(() => {})
  } catch {
    // ignorar falha de parse
  }

  settings.readerTheme = themeModeToReaderTheme(settings.themeMode)
  applyTheme(settings.themeMode)
}

export function useSettings() {
  initSettings()

  const saveLocally = () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      localStorage.setItem('aresta_reader_font', settings.epubFontFamily)
      localStorage.setItem('aresta_reader_page_crease', String(settings.pageCreaseEnabled))
      localStorage.setItem('aresta_home_graph_collapsed', String(!settings.desktopHomeGraphOpen))
      trySyncReaderStore()
    } catch {
      // localStorage indisponível
    }
  }

  const persistToLocalDb = async () => {
    try {
      await settingsRepo.save({
        pageAnimationEnabled: settings.pageAnimationEnabled,
        pageCreaseEnabled: settings.pageCreaseEnabled,
        language: settings.language,
        nativeLanguage: settings.nativeLanguage,
        targetTranslationLanguage: settings.targetTranslationLanguage,
        epubFontSize: settings.epubFontSize,
        epubFontFamily: settings.epubFontFamily,
        themeMode: settings.themeMode,
        readerTheme: settings.readerTheme,
        desktopHomeGraphOpen: settings.desktopHomeGraphOpen,
        desktopReaderGraphOpen: settings.desktopReaderGraphOpen,
        readerTwoPageMode: settings.readerTwoPageMode,
        readerWidthMode: settings.readerWidthMode,
      })
    } catch (e) {
      console.warn('[useSettings] Falha ao salvar configurações no banco local:', e)
    }
  }

  const loadFromServer = async () => {
    try {
      const dbSettings = await settingsRepo.get()
      if (dbSettings) {
        if (typeof dbSettings.pageAnimationEnabled === 'boolean') settings.pageAnimationEnabled = dbSettings.pageAnimationEnabled
        if (typeof dbSettings.pageCreaseEnabled === 'boolean') settings.pageCreaseEnabled = dbSettings.pageCreaseEnabled
        if (typeof dbSettings.language === 'string') settings.language = dbSettings.language
        if (typeof dbSettings.nativeLanguage === 'string') settings.nativeLanguage = dbSettings.nativeLanguage
        if (typeof dbSettings.targetTranslationLanguage === 'string') settings.targetTranslationLanguage = dbSettings.targetTranslationLanguage
        if (typeof dbSettings.epubFontSize === 'number') settings.epubFontSize = dbSettings.epubFontSize
        if (dbSettings.epubFontFamily) settings.epubFontFamily = dbSettings.epubFontFamily as EpubFontFamilyId
        if (dbSettings.themeMode) settings.themeMode = dbSettings.themeMode as ThemeMode
        if (dbSettings.readerTheme) settings.readerTheme = dbSettings.readerTheme as ReaderColorTheme
        if (typeof dbSettings.desktopHomeGraphOpen === 'boolean') settings.desktopHomeGraphOpen = dbSettings.desktopHomeGraphOpen
        if (typeof dbSettings.desktopReaderGraphOpen === 'boolean') settings.desktopReaderGraphOpen = dbSettings.desktopReaderGraphOpen
        if (typeof dbSettings.readerTwoPageMode === 'boolean') settings.readerTwoPageMode = dbSettings.readerTwoPageMode
        if (dbSettings.readerWidthMode) settings.readerWidthMode = dbSettings.readerWidthMode as ReaderWidthMode
        saveLocally()
        applyTheme(settings.themeMode)
        trySyncReaderStore()
      }
    } catch {
      // fallback
    }
  }

  const setPageAnimationEnabled = (enabled: boolean) => {
    settings.pageAnimationEnabled = enabled
    settings.pageCreaseEnabled = enabled
    saveLocally()
    void persistToLocalDb()
  }

  const setPageCreaseEnabled = (enabled: boolean) => {
    settings.pageCreaseEnabled = enabled
    settings.pageAnimationEnabled = enabled
    saveLocally()
    void persistToLocalDb()
  }

  const setLanguage = (lang: string) => {
    settings.language = lang
    saveLocally()
    void persistToLocalDb()
  }

  const setNativeLanguage = (lang: DictionaryLanguage | string) => {
    settings.nativeLanguage = lang
    saveLocally()
    void persistToLocalDb()
  }

  const setTargetTranslationLanguage = (lang: DictionaryLanguage | string) => {
    settings.targetTranslationLanguage = lang
    saveLocally()
    void persistToLocalDb()
  }

  const setEpubFontSize = (size: number) => {
    settings.epubFontSize = Math.max(12, Math.min(36, Math.round(size)))
    saveLocally()
    void persistToLocalDb()
  }

  const setEpubFontFamily = (family: EpubFontFamilyId) => {
    settings.epubFontFamily = family
    saveLocally()
    void persistToLocalDb()
  }

  const setThemeMode = (mode: ThemeMode) => {
    settings.themeMode = mode
    const rTheme = themeModeToReaderTheme(mode)
    settings.readerTheme = rTheme
    applyTheme(mode)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aresta_reader_theme', rTheme)
      } catch {
        /* ignorar */
      }
    }
    saveLocally()
    void persistToLocalDb()
  }

  const setDesktopHomeGraphOpen = (open: boolean) => {
    settings.desktopHomeGraphOpen = open
    saveLocally()
    void persistToLocalDb()
  }

  const setReaderTheme = (theme: ReaderColorTheme) => {
    if (theme === 'white' || theme === 'sepia' || theme === 'black') {
      const mode = readerThemeToThemeMode(theme)
      settings.readerTheme = theme
      settings.themeMode = mode
      applyTheme(mode)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aresta_reader_theme', theme)
        } catch {
          /* ignorar */
        }
      }
      saveLocally()
      void persistToLocalDb()
    }
  }

  const setReaderReadingMode = (mode: ReadingMode) => {
    if (mode === 'paginated' || mode === 'scroll') {
      settings.readerReadingMode = mode
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aresta_reading_mode', mode)
        } catch {
          /* ignorar */
        }
      }
      saveLocally()
      void persistToLocalDb()
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

  const readerReadingMode = computed({
    get: () => settings.readerReadingMode,
    set: (val: ReadingMode) => setReaderReadingMode(val),
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
    readerReadingMode,
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
    setReaderReadingMode,
    toggleThemeMode,
    setDesktopHomeGraphOpen,
    loadFromServer,
  }
}
