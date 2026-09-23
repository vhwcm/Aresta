import { ref, computed } from 'vue'
import { useAuth, type AuthUser, purgeClientSession } from './useAuth'
import { getApiRoot, getOAuthRedirectUri } from '~/utils/apiBase'

export interface OAuthResult {
  success: boolean
  provider?: string
  user?: AuthUser
  accessToken?: string
  isNewUser?: boolean
  error?: string
}

const getAuthApiUrl = () => {
  return getApiRoot()
}

// Access tokens são efêmeros e ficam somente em memória. Refresh tokens nunca
// são enviados pelo backend ao browser.
const cloudTokens = new Map<'google' | 'onedrive', string>()
const sharedGoogleDriveToken = ref<string | null>(null)

export const useOAuth = () => {
  const auth = useAuth()
  const isLoggingIn = ref(false)
  const oauthError = ref<string | null>(null)

  const googleDriveToken = sharedGoogleDriveToken
  const isGoogleDriveConnected = computed(() => !!googleDriveToken.value)

  const setGoogleDriveToken = (token: string | null) => {
    sharedGoogleDriveToken.value = token
    if (token) cloudTokens.set('google', token)
    else cloudTokens.delete('google')
  }

  const setOneDriveToken = (token: string | null) => {
    if (token) cloudTokens.set('onedrive', token)
    else cloudTokens.delete('onedrive')
  }

  const refreshCloudToken = async (provider: 'google' | 'onedrive'): Promise<string | null> => {
    if (!auth.token.value) return null
    try {
      const data = await $fetch<{ accessToken: string }>(
        `${getAuthApiUrl()}/api/auth/cloud/${provider}/access-token`,
        { method: 'POST', headers: { Authorization: `Bearer ${auth.token.value}` } }
      )
      if (!data?.accessToken) return null
      if (provider === 'google') setGoogleDriveToken(data.accessToken)
      else setOneDriveToken(data.accessToken)
      return data.accessToken
    } catch (err) {
      console.warn(`[useOAuth] Não foi possível obter token do ${provider}:`, err)
      return null
    }
  }

  const refreshGoogleToken = async (): Promise<string | null> => {
    if (!auth.token.value) return null
    return refreshCloudToken('google')
  }

  const ensureGoogleDriveToken = async (): Promise<string | null> => {
    if (sharedGoogleDriveToken.value) {
      return sharedGoogleDriveToken.value
    }
    return await refreshGoogleToken()
  }

  const getCloudToken = (provider: 'google' | 'onedrive' | 'apple'): string | null => {
    if (provider === 'google') return cloudTokens.get('google') || null
    if (provider === 'onedrive') return cloudTokens.get('onedrive') || null
    return null
  }

  const pollOAuthSession = async (
    ticket: string,
    timeoutMs = 120_000
  ): Promise<{ token: string; user: AuthUser; isNewUser?: boolean; oauth: any } | null> => {
    const startTime = Date.now()
    const authUrl = getAuthApiUrl()

    while (Date.now() - startTime < timeoutMs) {
      await new Promise((r) => setTimeout(r, 1200))
      try {
        const data = await $fetch<{
          authenticated: boolean
          token?: string
          user?: AuthUser
          isNewUser?: boolean
          oauth?: any
        }>(`${authUrl}/api/auth/oauth/session-poll?ticket=${encodeURIComponent(ticket)}`)

        if (data?.authenticated && data.token && data.user) {
          return {
            token: data.token,
            user: data.user,
            isNewUser: data.isNewUser,
            oauth: data.oauth,
          }
        }
      } catch {
        // Ignora falhas transitórias de polling
      }
    }
    return null
  }

  const openOAuthPopup = async (url: string, provider: string): Promise<string> => {
    const width = 520
    const height = 650
    const left = typeof window !== 'undefined' ? window.screenX + (window.outerWidth - width) / 2 : 100
    const top = typeof window !== 'undefined' ? window.screenY + (window.outerHeight - height) / 2 : 100

    let popup: Window | null = null
    try {
      popup = window.open(
        url,
        `aresta_oauth_${provider}`,
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      )
    } catch {
      // Ignora erro se popup for bloqueado pelo sistema nativo
    }

    return new Promise<string>((resolve, reject) => {
      let timer: any = null

      const messageHandler = (event: MessageEvent) => {
        if ((event.data?.type === 'ARESTA_OAUTH_CODE' || event.data?.type === 'ARESTA_OAUTH_SUCCESS') && event.data?.code) {
          cleanup()
          resolve(event.data.code)
        } else if (event.data?.type === 'ARESTA_OAUTH_ERROR') {
          cleanup()
          reject(new Error(event.data.error || 'Autorização cancelada'))
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

      if (popup) {
        timer = setInterval(() => {
          try {
            if (popup?.closed) {
              cleanup()
              // Não rejeita imediatamente no mobile para permitir que o polling conclua
            }
          } catch {}
        }, 800)
      }
    })
  }

  /**
   * Executa o fluxo OAuth para login/criação de conta (suporte a Web, Popup e APK Android).
   */
  const loginWithOAuth = async (
    provider: 'google' | 'microsoft' | 'apple'
  ): Promise<OAuthResult> => {
    isLoggingIn.value = true
    oauthError.value = null

    try {
      const authUrl = getAuthApiUrl()
      const redirectUri = getOAuthRedirectUri()
      const ticket = 'ticket_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)

      const { url } = await $fetch<{ url: string }>(
        `${authUrl}/api/auth/oauth/${provider}/url?redirectUri=${encodeURIComponent(redirectUri)}&state=${ticket}`
      )

      if (!url) {
        throw new Error('Falha ao obter URL de autorização do provedor.')
      }

      const pollPromise = pollOAuthSession(ticket)
      const popupPromise = openOAuthPopup(url, provider)

      // Corrida: o que resolver primeiro (polling de background ou mensagem de popup)
      const raceResult = await Promise.race([
        pollPromise,
        popupPromise.then(async (code) => {
          const res = await $fetch<{
            token: string
            user: AuthUser
            isNewUser?: boolean
            oauth: { provider: string; scope?: string }
          }>(`${authUrl}/api/auth/oauth/${provider}/callback`, {
            method: 'POST',
            body: { code, redirectUri, state: ticket },
          })
          return res
        })
      ])

      const authData = raceResult || (await pollPromise)
      if (!authData || !authData.token) {
        throw new Error('Tempo limite de autorização excedido. Por favor, tente novamente.')
      }

      await purgeClientSession()
      auth.setSession(authData.token, authData.user)

      if (typeof localStorage !== 'undefined' && provider === 'google') {
        localStorage.setItem('aresta_drive_provider', 'google')
      }

      if (provider === 'google') {
        await refreshCloudToken('google')
      }
      if (provider === 'microsoft') {
        await refreshCloudToken('onedrive')
      }

      return {
        success: true,
        provider,
        user: authData.user,
        isNewUser: authData.isNewUser ?? false,
        accessToken: (provider === 'google' ? getCloudToken('google') : getCloudToken('onedrive')) || undefined,
      }
    } catch (err: any) {
      const msg = err?.message || 'Erro ao autenticar com o provedor.'
      oauthError.value = msg
      return { success: false, error: msg }
    } finally {
      isLoggingIn.value = false
    }
  }

  /**
   * Conecta um Drive à conta autenticada sem alterar a sessão de login atual.
   */
  const connectDriveOnly = async (
    provider: 'google' | 'microsoft'
  ): Promise<{ success: boolean; accessToken?: string; error?: string }> => {
    if (!auth.token.value) {
      throw new Error('Usuário precisa estar autenticado para conectar o Drive.')
    }
    isLoggingIn.value = true
    oauthError.value = null

    try {
      const authUrl = getAuthApiUrl()
      const redirectUri = getOAuthRedirectUri()

      const { url } = await $fetch<{ url: string }>(
        `${authUrl}/api/auth/oauth/${provider}/url?redirectUri=${encodeURIComponent(redirectUri)}&mode=connect_drive`
      )

      if (!url) {
        throw new Error('Falha ao obter URL de conexão com o Drive.')
      }

      const code = await openOAuthPopup(url, provider)

      const response = await $fetch<{
        success: boolean
        provider: string
        accessToken: string
      }>(`${authUrl}/api/auth/oauth/${provider}/link-drive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token.value}` },
        body: { code, redirectUri },
      })

      if (provider === 'google') {
        setGoogleDriveToken(response.accessToken)
        if (typeof localStorage !== 'undefined') localStorage.setItem('aresta_drive_provider', 'google')
      }
      if (provider === 'microsoft') {
        setOneDriveToken(response.accessToken)
        if (typeof localStorage !== 'undefined') localStorage.setItem('aresta_drive_provider', 'onedrive')
      }

      return {
        success: true,
        accessToken: response.accessToken,
      }
    } catch (err: any) {
      const msg = err?.message || 'Erro ao conectar o Drive.'
      oauthError.value = msg
      return { success: false, error: msg }
    } finally {
      isLoggingIn.value = false
    }
  }

  const disconnectDriveOnly = async (provider: 'google' | 'microsoft') => {
    if (!auth.token.value) return
    try {
      const authUrl = getAuthApiUrl()
      await $fetch(`${authUrl}/api/auth/oauth/${provider}/unlink-drive`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.token.value}` },
      })
    } catch (e) {
      console.warn('[useOAuth] Erro ao desvincular drive no backend:', e)
    } finally {
      if (provider === 'google') setGoogleDriveToken(null)
      if (provider === 'microsoft') setOneDriveToken(null)
      if (typeof localStorage !== 'undefined') localStorage.removeItem('aresta_drive_provider')
    }
  }

  return {
    isLoggingIn,
    oauthError,
    googleDriveToken,
    isGoogleDriveConnected,
    loginWithOAuth,
    connectDriveOnly,
    disconnectDriveOnly,
    setGoogleDriveToken,
    setOneDriveToken,
    getCloudToken,
    refreshCloudToken,
    refreshGoogleToken,
    ensureGoogleDriveToken,
  }
}
