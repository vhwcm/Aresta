import { reactive, computed, readonly } from 'vue'
import { useAuth } from '~/composables/useAuth'

export type ThemeMode = 'dark' | 'light'
export type EpubFontFamilyId = 'newsreader' | 'literata' | 'lora' | 'merriweather' | 'inter'

export interface SettingsState {
  pageAnimationEnabled: boolean
  language: string
  epubFontSize: number
  epubFontFamily: EpubFontFamilyId
  themeMode: ThemeMode
  desktopHomeGraphOpen: boolean
  desktopReaderGraphOpen: boolean
}

export interface UserSettingsResponse {
  userId: number
  pageAnimationEnabled: boolean
  language: string
  epubFontSize?: number
  epubFontFamily?: EpubFontFamilyId
  themeMode?: ThemeMode
  desktopHomeGraphOpen?: boolean
  desktopReaderGraphOpen?: boolean
  updatedAt?: string | null
}

const API_BASE = 'http://localhost:7070/api'
const STORAGE_KEY = 'aresta_settings'

const settings = reactive<SettingsState>({
  pageAnimationEnabled: true,
  language: 'pt-BR',
  epubFontSize: 18,
  epubFontFamily: 'newsreader',
  themeMode: 'dark',
  desktopHomeGraphOpen: true,
  desktopReaderGraphOpen: true,
})

let isInitialized = false

export function resetSettingsForTesting() {
  settings.pageAnimationEnabled = true
  settings.language = 'pt-BR'
  settings.epubFontSize = 18
  settings.epubFontFamily = 'newsreader'
  settings.themeMode = 'dark'
  settings.desktopHomeGraphOpen = true
  settings.desktopReaderGraphOpen = true
  isInitialized = false
}

export function applyTheme(mode: ThemeMode) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const root = document.documentElement
  const body = document.body

  root.setAttribute('data-theme', mode)
  if (mode === 'light') {
    root.classList.add('light-theme')
    if (body) body.classList.add('light-theme')
  } else {
    root.classList.remove('light-theme')
    if (body) body.classList.remove('light-theme')
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
      if (typeof parsed.language === 'string') {
        settings.language = parsed.language
      }
      if (typeof parsed.epubFontSize === 'number') {
        settings.epubFontSize = Math.max(12, Math.min(36, Math.round(parsed.epubFontSize)))
      }
      if (typeof parsed.epubFontFamily === 'string' && ['newsreader', 'literata', 'lora', 'merriweather', 'inter'].includes(parsed.epubFontFamily)) {
        settings.epubFontFamily = parsed.epubFontFamily
      }
      if (parsed.themeMode === 'dark' || parsed.themeMode === 'light') {
        settings.themeMode = parsed.themeMode
      }
      if (typeof parsed.desktopHomeGraphOpen === 'boolean') {
        settings.desktopHomeGraphOpen = parsed.desktopHomeGraphOpen
      }
      if (typeof parsed.desktopReaderGraphOpen === 'boolean') {
        settings.desktopReaderGraphOpen = parsed.desktopReaderGraphOpen
      }
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
  if (typeof data.language === 'string') {
    settings.language = data.language
  }
  if (typeof data.epubFontSize === 'number') {
    settings.epubFontSize = Math.max(12, Math.min(36, Math.round(data.epubFontSize)))
  }
  if (data.epubFontFamily && ['newsreader', 'literata', 'lora', 'merriweather', 'inter'].includes(data.epubFontFamily)) {
    settings.epubFontFamily = data.epubFontFamily
  }
  if (data.themeMode === 'dark' || data.themeMode === 'light') {
    settings.themeMode = data.themeMode
  }
  if (typeof data.desktopHomeGraphOpen === 'boolean') {
    settings.desktopHomeGraphOpen = data.desktopHomeGraphOpen
  }
  if (typeof data.desktopReaderGraphOpen === 'boolean') {
    settings.desktopReaderGraphOpen = data.desktopReaderGraphOpen
  }

  applyTheme(settings.themeMode)
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
      localStorage.setItem('aresta_home_graph_collapsed', String(!settings.desktopHomeGraphOpen))
    } catch {
      // ignorar quota error
    }
  }

  const persistToServer = async () => {
    if (!auth.token.value) return

    try {
      await $fetch<UserSettingsResponse>(`${API_BASE}/user-settings`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${auth.token.value}` },
        body: {
          pageAnimationEnabled: settings.pageAnimationEnabled,
          language: settings.language,
          epubFontSize: settings.epubFontSize,
          epubFontFamily: settings.epubFontFamily,
          themeMode: settings.themeMode,
          desktopHomeGraphOpen: settings.desktopHomeGraphOpen,
          desktopReaderGraphOpen: settings.desktopReaderGraphOpen,
        },
      })
    } catch {
      // manter valor local se a API falhar
    }
  }

  const loadFromServer = async () => {
    if (!auth.token.value) return

    try {
      const data = await $fetch<UserSettingsResponse>(`${API_BASE}/user-settings`, {
        headers: { Authorization: `Bearer ${auth.token.value}` },
      })
      applyServerSettings(data)
      saveLocally()
    } catch {
      // manter valores locais se a API falhar
    }
  }

  const setPageAnimationEnabled = (enabled: boolean) => {
    settings.pageAnimationEnabled = enabled
    saveLocally()
    void persistToServer()
  }

  const setLanguage = (lang: string) => {
    settings.language = lang
    saveLocally()
    void persistToServer()
  }

  const setEpubFontSize = (size: number) => {
    const clamped = Math.max(12, Math.min(36, Math.round(size)))
    settings.epubFontSize = clamped
    saveLocally()
    void persistToServer()
  }

  const setEpubFontFamily = (familyId: EpubFontFamilyId | string) => {
    if (['newsreader', 'literata', 'lora', 'merriweather', 'inter'].includes(familyId)) {
      settings.epubFontFamily = familyId as EpubFontFamilyId
      saveLocally()
      void persistToServer()
    }
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

  const setDesktopReaderGraphOpen = (open: boolean) => {
    settings.desktopReaderGraphOpen = open
    saveLocally()
    void persistToServer()
  }

  const toggleThemeMode = () => {
    setThemeMode(settings.themeMode === 'dark' ? 'light' : 'dark')
  }

  const pageAnimationEnabled = computed({
    get: () => settings.pageAnimationEnabled,
    set: (val: boolean) => setPageAnimationEnabled(val),
  })

  const language = computed({
    get: () => settings.language,
    set: (val: string) => setLanguage(val),
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

  const desktopHomeGraphOpen = computed({
    get: () => settings.desktopHomeGraphOpen,
    set: (val: boolean) => setDesktopHomeGraphOpen(val),
  })

  const desktopReaderGraphOpen = computed({
    get: () => settings.desktopReaderGraphOpen,
    set: (val: boolean) => setDesktopReaderGraphOpen(val),
  })

  return {
    settings: readonly(settings),
    pageAnimationEnabled,
    language,
    epubFontSize,
    epubFontFamily,
    themeMode,
    desktopHomeGraphOpen,
    desktopReaderGraphOpen,
    setPageAnimationEnabled,
    setLanguage,
    setEpubFontSize,
    setEpubFontFamily,
    setThemeMode,
    toggleThemeMode,
    setDesktopHomeGraphOpen,
    setDesktopReaderGraphOpen,
    loadFromServer,
  }
}

