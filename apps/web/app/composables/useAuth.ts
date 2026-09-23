import { ref, computed } from 'vue'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { resetUserBooksMemory } from '~/composables/useUserBooks'
import { resetGraphMemory } from '~/composables/useGraph'
import { resetAnnotationsMemory } from '~/composables/useAnnotations'
import { resetFlashcardsMemory } from '~/composables/useFlashcards'
import { resetNotesMemory } from '~/composables/useNotes'
import { resetGraphMeta } from '~/utils/graphMeta'
import { clearAllLocalData } from '~/adapters/database/DatabaseManager'
import { getApiRoot } from '~/utils/apiBase'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  isActive: boolean
}

export interface LoginResponse {
  token: string
  isNewUser?: boolean
  user: AuthUser
}

const getAuthApiUrl = () => {
  return getApiRoot()
}

// Module-level reactive singleton state shared across all components and composables
const sharedToken = ref<string | null>(null)
const sharedUser = ref<AuthUser | null>(null)
let isInitialized = false

/**
 * Opções de cookie seguras e adaptativas.
 * Em WebViews móveis (Tauri no Android APK) ou localhost, o protocolo é "http:" ou customizado ("tauri:").
 * Definir 'secure: true' em conexões inseguras faz o WebView/browser rejeitar o cookie silenciosamente (RFC 6265bis).
 * Portanto, secure é estritamente restrito a origens HTTPS reais.
 */
export const getCookieOptions = () => {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
  return {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    sameSite: 'lax' as const,
    secure: isHttps,
  }
}

/**
 * Lê de forma resiliente o token de autenticação em qualquer contexto (cliente ou SSR),
 * priorizando o estado reativo compartilhado, seguido por localStorage e cookies.
 */
export const getStoredAuthToken = (): string | null => {
  if (sharedToken.value) {
    return sharedToken.value
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('aresta_token')
      if (stored) {
        const clean = stored.startsWith('"') && stored.endsWith('"') ? JSON.parse(stored) : stored
        if (clean) return clean
      }
    } catch {}
  }

  if (typeof useCookie === 'function') {
    try {
      const cookie = useCookie<string | null>('aresta_token', getCookieOptions())
      if (cookie.value) return cookie.value
    } catch {}
  }

  return null
}

const syncCookies = (token: string | null, user: AuthUser | null) => {
  if (typeof useCookie === 'function') {
    try {
      const cookieOpts = getCookieOptions()
      const tokenCookie = useCookie<string | null>('aresta_token', cookieOpts)
      const userCookie = useCookie<AuthUser | null>('aresta_user', cookieOpts)
      tokenCookie.value = token
      userCookie.value = user
    } catch (e) {
      // Ignora falhas em ambientes restritos
    }
  }
}

const clearAllAuthCookies = () => {
  if (typeof document !== 'undefined') {
    const cookieNames = ['aresta_token', 'aresta_user']
    const paths = ['/', '/conta', '/login', '']
    cookieNames.forEach((name) => {
      paths.forEach((p) => {
        const pathPart = p ? `; path=${p}` : ''
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0${pathPart}`
      })
    })
  }
}

export const initAuthState = () => {
  if (isInitialized) return
  isInitialized = true

  let token: string | null = null
  let user: AuthUser | null = null

  // 1. Prioridade: LocalStorage (essencial para APK Android / WebView / Local-First)
  if (typeof window !== 'undefined') {
    try {
      const localToken = localStorage.getItem('aresta_token')
      if (localToken) {
        token = localToken.startsWith('"') && localToken.endsWith('"') ? JSON.parse(localToken) : localToken
      }

      const localUser = localStorage.getItem('aresta_user')
      if (localUser) {
        user = JSON.parse(localUser)
      }
    } catch (e) {
      console.warn('[useAuth] Falha ao ler sessão do localStorage:', e)
    }
  }

  // 2. Fallback e sincronização bidirecional com Cookies (Web)
  if (typeof useCookie === 'function') {
    try {
      const cookieOpts = getCookieOptions()
      const tokenCookie = useCookie<string | null>('aresta_token', cookieOpts)
      const userCookie = useCookie<AuthUser | null>('aresta_user', cookieOpts)

      if (!token && tokenCookie.value) {
        token = tokenCookie.value
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('aresta_token', token)
          } catch {}
        }
      } else if (token && !tokenCookie.value) {
        tokenCookie.value = token
      }

      if (!user && userCookie.value) {
        user = userCookie.value
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('aresta_user', JSON.stringify(user))
          } catch {}
        }
      } else if (user && !userCookie.value) {
        userCookie.value = user
      }
    } catch {}
  }

  sharedToken.value = token
  sharedUser.value = user
}

export const setSession = (token: string, user: AuthUser) => {
  initAuthState()
  sharedToken.value = token
  sharedUser.value = user

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('aresta_token', token)
      localStorage.setItem('aresta_user', JSON.stringify(user))
    } catch (e) {
      console.error('[useAuth] Falha ao persistir sessão no localStorage:', e)
    }
  }

  syncCookies(token, user)
}

export const clearSession = () => {
  sharedToken.value = null
  sharedUser.value = null

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem('aresta_token')
      localStorage.removeItem('aresta_user')
    } catch {}
  }

  syncCookies(null, null)
  clearAllAuthCookies()
}

export const purgeClientSession = async () => {
  resetUserBooksMemory()
  resetGraphMemory()
  resetAnnotationsMemory()
  resetFlashcardsMemory()
  resetNotesMemory()
  resetGraphMeta()
  if (typeof localStorage !== 'undefined') {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('aresta_') || key.startsWith('aresta:'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  }
  if (typeof sessionStorage !== 'undefined') {
    const sessionKeys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.startsWith('aresta_') || key.startsWith('aresta:'))) {
        sessionKeys.push(key)
      }
    }
    sessionKeys.forEach((k) => sessionStorage.removeItem(k))
  }
  await clearAllLocalData()
}

export const useAuth = () => {
  initAuthState()

  const isLoggedIn = computed(() => !!sharedToken.value)
  const user = computed(() => sharedUser.value)
  const isAdmin = computed(() => sharedUser.value?.role === 'ADMIN')

  const login = async (loginId: string, passwordStr: string) => {
    try {
      const authUrl = getAuthApiUrl()
      const response = await $fetch<LoginResponse>(`${authUrl}/api/auth/login`, {
        method: 'POST',
        body: {
          email: loginId,
          login: loginId,
          password: passwordStr
        }
      })

      await purgeClientSession()
      setSession(response.token, response.user)
      return { success: true, user: response.user, isNewUser: response.isNewUser ?? false }
    } catch (e: any) {
      console.error('Erro no login:', e)
      const errorMsg = e.data?.error || e.data?.message || e.statusMessage || 'Falha ao autenticar. Verifique o login e a senha.'
      return { success: false, error: typeof errorMsg === 'string' ? errorMsg : 'Usuário ou senha inválidos.' }
    }
  }

  const register = async (name: string, email: string, passwordStr: string) => {
    try {
      await purgeClientSession()
      const authUrl = getAuthApiUrl()
      const response = await $fetch<LoginResponse>(`${authUrl}/api/auth/register`, {
        method: 'POST',
        body: {
          name,
          email,
          password: passwordStr
        }
      })

      setSession(response.token, response.user)
      return { success: true, user: response.user, isNewUser: response.isNewUser ?? true }
    } catch (e: any) {
      console.error('Erro no registro:', e)
      const errorMsg = e.data?.error || e.data?.message || e.data || e.statusMessage || 'Falha ao registrar usuário.'
      return { success: false, error: typeof errorMsg === 'string' ? errorMsg : 'Falha ao registrar usuário.' }
    }
  }

  const logout = async () => {
    clearSession()
    await purgeClientSession()
    if (typeof navigateTo === 'function') {
      await navigateTo('/', { replace: true })
    }
  }

  const deleteAccount = async () => {
    if (!sharedToken.value) return { success: false, error: 'Usuário não autenticado.' }
    try {
      // 1. Tenta limpar todos os arquivos da pasta Aresta no Google Drive do usuário
      try {
        const { GoogleDriveStorageProvider } = await import('~/adapters/storage/cloud/GoogleDriveStorageProvider')
        const { useOAuth } = await import('~/composables/useOAuth')
        const { ensureGoogleDriveToken } = useOAuth()
        const token = await ensureGoogleDriveToken()
        if (token) {
          const provider = new GoogleDriveStorageProvider(() => token)
          await provider.deleteAllArestaData()
        }
      } catch (driveErr) {
        console.warn('[useAuth] Aviso ao limpar arquivos do Google Drive no cliente:', driveErr)
      }

      // 2. Chama o backend para exclusão no banco e redundância na nuvem
      const authUrl = getAuthApiUrl()
      await $fetch(`${authUrl}/api/auth/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sharedToken.value}` }
      })

      // 3. Limpa credenciais, cookies e dados locais
      clearSession()
      await purgeClientSession()
      if (typeof navigateTo === 'function') {
        await navigateTo('/', { replace: true })
      }
      return { success: true }
    } catch (e: any) {
      console.error('Erro ao deletar conta:', e)
      const errorMsg = e.data?.message || e.data?.error || e.data || e.statusMessage || 'Falha ao deletar conta.'
      return { success: false, error: typeof errorMsg === 'string' ? errorMsg : 'Falha ao excluir conta.' }
    }
  }

  const updateProfile = async (name: string) => {
    if (!sharedToken.value) return { success: false, error: 'Usuário não autenticado.' }
    try {
      const authUrl = getAuthApiUrl()
      const response = await $fetch<{ user: AuthUser }>(`${authUrl}/api/users/me/profile`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${sharedToken.value}` },
        body: { name }
      })
      if (response?.user) {
        const updated = { ...sharedUser.value, ...response.user }
        sharedUser.value = updated
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('aresta_user', JSON.stringify(updated))
          } catch {}
        }
        syncCookies(sharedToken.value, updated)
      }
      return { success: true, user: response.user }
    } catch (e: any) {
      console.error('Erro ao atualizar perfil:', e)
      const errorMsg = e.data?.error || e.data?.message || 'Falha ao atualizar perfil.'
      return { success: false, error: typeof errorMsg === 'string' ? errorMsg : 'Falha ao atualizar perfil.' }
    }
  }

  const isOnboardingCompleted = (userId?: number): boolean => {
    if (typeof window === 'undefined') return true
    const id = userId || sharedUser.value?.id
    if (!id) return true
    return localStorage.getItem(`aresta_onboarding_completed_${id}`) === 'true'
  }

  const completeOnboarding = (userId?: number) => {
    if (typeof window === 'undefined') return
    const id = userId || sharedUser.value?.id
    if (id) {
      localStorage.setItem(`aresta_onboarding_completed_${id}`, 'true')
    }
  }

  const fetchCurrentUser = async () => {
    if (!sharedToken.value) return null
    try {
      const authUrl = getAuthApiUrl()
      const data = await $fetch<any>(`${authUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${sharedToken.value}` }
      })
      const userData = data?.user || data
      sharedUser.value = userData
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('aresta_user', JSON.stringify(userData))
        } catch {}
      }
      syncCookies(sharedToken.value, userData)
      return userData
    } catch (e) {
      clearSession()
      return null
    }
  }

  return {
    token: sharedToken,
    user,
    isLoggedIn,
    isAdmin,
    setSession,
    clearSession,
    login,
    register,
    logout,
    deleteAccount,
    updateProfile,
    isOnboardingCompleted,
    completeOnboarding,
    fetchCurrentUser,
    purgeClientSession
  }
}
