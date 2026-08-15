import { reactive, computed, readonly } from 'vue'
import { useAuth } from '~/composables/useAuth'

export interface SettingsState {
  pageAnimationEnabled: boolean
  language: string
}

export interface UserSettingsResponse {
  userId: number
  pageAnimationEnabled: boolean
  language: string
  updatedAt?: string | null
}

const API_BASE = 'http://localhost:7070/api'
const STORAGE_KEY = 'aresta_settings'

const settings = reactive<SettingsState>({
  pageAnimationEnabled: true,
  language: 'pt-BR',
})

let isInitialized = false

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
    }
  } catch {
    // ignorar falha de parse
  }
}

function applyServerSettings(data: UserSettingsResponse) {
  settings.pageAnimationEnabled = data.pageAnimationEnabled
  settings.language = data.language
}

export function useSettings() {
  initSettings()

  const auth = useAuth()

  const saveLocally = () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
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

  const pageAnimationEnabled = computed({
    get: () => settings.pageAnimationEnabled,
    set: (val: boolean) => setPageAnimationEnabled(val),
  })

  const language = computed({
    get: () => settings.language,
    set: (val: string) => setLanguage(val),
  })

  return {
    settings: readonly(settings),
    pageAnimationEnabled,
    language,
    setPageAnimationEnabled,
    setLanguage,
    loadFromServer,
  }
}
