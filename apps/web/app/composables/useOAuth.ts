import { ref, computed } from 'vue'
import { useAuth, type AuthUser } from './useAuth'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'

export interface OAuthResult {
  success: boolean
  provider?: string
  user?: AuthUser
  accessToken?: string
  isNewUser?: boolean
  error?: string
}

const getAuthApiUrl = () => {
  if (typeof useRuntimeConfig === 'function') {
    try {
      const config = useRuntimeConfig()
      if (config?.public?.authApiUrl) {
        return config.public.authApiUrl
      }
    } catch {
      // fallback gracioso
    }
  }
  return 'http://localhost:3001'
}

const GOOGLE_TOKEN_KEY = 'aresta_google_drive_token'
const ONEDRIVE_TOKEN_KEY = 'aresta_onedrive_token'

// Estado compartilhado singleton entre todos os composables e componentes
const sharedGoogleDriveToken = ref<string | null>(
  typeof window !== 'undefined' ? localStorage.getItem(GOOGLE_TOKEN_KEY) : null
)

export const useOAuth = () => {
  const auth = useAuth()
  const isLoggingIn = ref(false)
  const oauthError = ref<string | null>(null)

  if (typeof window !== 'undefined') {
    const currentStored = localStorage.getItem(GOOGLE_TOKEN_KEY)
    if (currentStored !== sharedGoogleDriveToken.value) {
      sharedGoogleDriveToken.value = currentStored
    }
  }

  const googleDriveToken = sharedGoogleDriveToken
  const isGoogleDriveConnected = computed(() => !!googleDriveToken.value)

  const setGoogleDriveToken = (token: string | null) => {
    sharedGoogleDriveToken.value = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(GOOGLE_TOKEN_KEY, token)
      } else {
        localStorage.removeItem(GOOGLE_TOKEN_KEY)
      }
    }
  }

  const setOneDriveToken = (token: string | null) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(ONEDRIVE_TOKEN_KEY, token)
      } else {
        localStorage.removeItem(ONEDRIVE_TOKEN_KEY)
      }
    }
  }

  const refreshGoogleToken = async (): Promise<string | null> => {
    if (!auth.token.value) return null
    try {
      const authUrl = getAuthApiUrl()
      const data = await $fetch<{ accessToken: string }>(
        `${authUrl}/api/auth/oauth/google/refresh`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.token.value}` },
        }
      )
      if (data?.accessToken) {
        setGoogleDriveToken(data.accessToken)
        return data.accessToken
      }
      return null
    } catch (err) {
      console.warn('[useOAuth] Não foi possível renovar o token do Google Drive:', err)
      return null
    }
  }

  const ensureGoogleDriveToken = async (): Promise<string | null> => {
    if (sharedGoogleDriveToken.value) {
      return sharedGoogleDriveToken.value
    }
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(GOOGLE_TOKEN_KEY)
      if (stored) {
        sharedGoogleDriveToken.value = stored
        return stored
      }
    }
    // Tenta renovar via backend se usuário autenticado
    return await refreshGoogleToken()
  }

  const getCloudToken = (provider: 'google' | 'onedrive' | 'apple'): string | null => {
    if (typeof window === 'undefined') return null
    if (provider === 'google') return localStorage.getItem(GOOGLE_TOKEN_KEY)
    if (provider === 'onedrive') return localStorage.getItem(ONEDRIVE_TOKEN_KEY)
    return null
  }

  /**
   * Executa o fluxo OAuth via janela popup sem recarregar a aplicação.
   */
  const loginWithOAuth = async (
    provider: 'google' | 'microsoft' | 'apple'
  ): Promise<OAuthResult> => {
    isLoggingIn.value = true
    oauthError.value = null

    try {
      const authUrl = getAuthApiUrl()
      const redirectUri = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback`

      // 1. Obtém URL de autorização do backend
      const { url } = await $fetch<{ url: string }>(
        `${authUrl}/api/auth/oauth/${provider}/url?redirectUri=${encodeURIComponent(redirectUri)}`
      )

      if (!url) {
        throw new Error('Falha ao obter URL de autorização do provedor.')
      }

      // 2. Abre popup centralizado
      const width = 520
      const height = 650
      const left = typeof window !== 'undefined' ? window.screenX + (window.outerWidth - width) / 2 : 100
      const top = typeof window !== 'undefined' ? window.screenY + (window.outerHeight - height) / 2 : 100

      const popup = window.open(
        url,
        `aresta_oauth_${provider}`,
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      )

      if (!popup) {
        throw new Error('Popup bloqueado pelo navegador. Por favor, autorize popups para entrar.')
      }

      // 3. Aguarda o retorno do código via mensagem postMessage ou polling na janela
      const code = await new Promise<string>((resolve, reject) => {
        let timer: any = null

        const messageHandler = (event: MessageEvent) => {
          if (event.data?.type === 'ARESTA_OAUTH_CODE' && event.data?.code) {
            cleanup()
            resolve(event.data.code)
          } else if (event.data?.type === 'ARESTA_OAUTH_ERROR') {
            cleanup()
            reject(new Error(event.data.error || 'Autenticação cancelada'))
          }
        }

        const cleanup = () => {
          if (typeof window !== 'undefined') {
            window.removeEventListener('message', messageHandler)
          }
          if (timer) clearInterval(timer)
        }

        if (typeof window !== 'undefined') {
          window.addEventListener('message', messageHandler)
        }

        // Fallback: detecta fechamento do popup ou navegação para a URL de callback
        timer = setInterval(() => {
          if (popup.closed) {
            cleanup()
            reject(new Error('Janela de login fechada antes de concluir a autorização.'))
            return
          }

          try {
            if (popup.location && popup.location.origin === window.location.origin) {
              const searchParams = new URLSearchParams(popup.location.search)
              const popupCode = searchParams.get('code')
              const popupError = searchParams.get('error')

              if (popupCode) {
                cleanup()
                popup.close()
                resolve(popupCode)
              } else if (popupError) {
                cleanup()
                popup.close()
                reject(new Error(popupError))
              }
            }
          } catch {
            // Cross-origin restriction normal enquanto está em domínio externo
          }
        }, 500)
      })

      // 4. Troca o código no backend
      const response = await $fetch<{
        token: string
        user: AuthUser
        isNewUser?: boolean
        oauth: { provider: string; accessToken: string; refreshToken?: string }
      }>(`${authUrl}/api/auth/oauth/${provider}/callback`, {
        method: 'POST',
        body: { code, redirectUri },
      })

      // 5. Atualiza sessão do Aresta e armazena token em nuvem
      const tokenCookie = useCookie<string | null>('aresta_token', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' })
      const userCookie = useCookie<AuthUser | null>('aresta_user', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' })

      if (userCookie.value && userCookie.value.id !== response.user.id) {
        try {
          await bookRepo.clear()
        } catch {}
      }

      tokenCookie.value = response.token
      userCookie.value = response.user

      if (response.oauth?.accessToken) {
        if (provider === 'google') {
          setGoogleDriveToken(response.oauth.accessToken)
        } else if (provider === 'microsoft') {
          setOneDriveToken(response.oauth.accessToken)
        }
      }

      return {
        success: true,
        provider,
        user: response.user,
        isNewUser: response.isNewUser ?? false,
        accessToken: response.oauth?.accessToken,
      }
    } catch (err: any) {
      const msg = err?.message || 'Erro ao autenticar com o provedor.'
      oauthError.value = msg
      return { success: false, error: msg }
    } finally {
      isLoggingIn.value = false
    }
  }

  return {
    isLoggingIn,
    oauthError,
    googleDriveToken,
    isGoogleDriveConnected,
    loginWithOAuth,
    setGoogleDriveToken,
    setOneDriveToken,
    getCloudToken,
    refreshGoogleToken,
    ensureGoogleDriveToken,
  }
}
