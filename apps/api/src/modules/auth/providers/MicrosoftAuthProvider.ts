import type { IAuthProvider, OAuthTokens, UserProfile } from './IAuthProvider'

export interface MicrosoftAuthConfig {
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  scopes?: string[]
}

export class MicrosoftAuthProvider implements IAuthProvider {
  readonly providerName = 'microsoft' as const
  private clientId: string
  private clientSecret: string
  private defaultRedirectUri: string
  private scopes: string[]

  constructor(config?: MicrosoftAuthConfig) {
    this.clientId = config?.clientId || process.env.MICROSOFT_CLIENT_ID || 'mock-ms-client-id'
    this.clientSecret = config?.clientSecret || process.env.MICROSOFT_CLIENT_SECRET || 'mock-ms-client-secret'
    this.defaultRedirectUri =
      config?.redirectUri ||
      process.env.MICROSOFT_REDIRECT_URI ||
      'http://localhost:3000/auth/callback'
    this.scopes = config?.scopes || [
      'openid',
      'profile',
      'email',
      'Files.ReadWrite.AppFolder',
      'offline_access',
    ]
  }

  getAuthUrl(state?: string, redirectUri?: string): string {
    const targetRedirect = redirectUri || this.defaultRedirectUri
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: targetRedirect,
      response_type: 'code',
      scope: this.scopes.join(' '),
      response_mode: 'query',
      prompt: 'consent',
      ...(state ? { state } : {}),
    })

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  }

  async handleCallback(code: string, redirectUri?: string): Promise<{ tokens: OAuthTokens; userProfile: UserProfile }> {
    const targetRedirect = redirectUri || this.defaultRedirectUri

    const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: targetRedirect,
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      throw new Error(`Falha ao obter tokens da Microsoft (${tokenRes.status}): ${errText}`)
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string
      refresh_token?: string
      expires_in?: number
      token_type?: string
      scope?: string
      id_token?: string
    }

    const tokens: OAuthTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
      idToken: tokenData.id_token,
    }

    // Obter perfil via Microsoft Graph API
    const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    })

    if (!userRes.ok) {
      const errText = await userRes.text()
      throw new Error(`Falha ao obter perfil do usuário Microsoft Graph: ${errText}`)
    }

    const userData = (await userRes.json()) as {
      id: string
      userPrincipalName?: string
      mail?: string
      displayName?: string
    }

    const email = userData.mail || userData.userPrincipalName || `${userData.id}@microsoft.local`
    const userProfile: UserProfile = {
      provider: 'microsoft',
      providerAccountId: userData.id,
      email,
      name: userData.displayName || email.split('@')[0] || 'Usuário Microsoft',
    }

    return { tokens, userProfile }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Falha ao renovar access token da Microsoft (${res.status}): ${errText}`)
    }

    const data = (await res.json()) as {
      access_token: string
      refresh_token?: string
      expires_in?: number
      token_type?: string
      scope?: string
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    }
  }
}
