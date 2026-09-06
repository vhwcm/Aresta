import type { IAuthProvider, OAuthTokens, UserProfile } from './IAuthProvider'

export interface GoogleAuthConfig {
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  scopes?: string[]
}

export class GoogleAuthProvider implements IAuthProvider {
  readonly providerName = 'google' as const
  private clientId: string
  private clientSecret: string
  private defaultRedirectUri: string
  private scopes: string[]

  constructor(config?: GoogleAuthConfig) {
    this.clientId = config?.clientId || process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id'
    this.clientSecret = config?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret'
    this.defaultRedirectUri =
      config?.redirectUri ||
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3000/auth/callback'
    this.scopes = config?.scopes || [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/drive.file',
    ]
  }

  getAuthUrl(state?: string, redirectUri?: string): string {
    const targetRedirect = redirectUri || this.defaultRedirectUri
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: targetRedirect,
      response_type: 'code',
      scope: this.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      ...(state ? { state } : {}),
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  async handleCallback(code: string, redirectUri?: string): Promise<{ tokens: OAuthTokens; userProfile: UserProfile }> {
    const targetRedirect = redirectUri || this.defaultRedirectUri

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
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
      throw new Error(`Falha ao obter tokens do Google (${tokenRes.status}): ${errText}`)
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

    // Obter dados do perfil do usuário
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    })

    if (!userRes.ok) {
      const errText = await userRes.text()
      throw new Error(`Falha ao obter perfil do usuário Google: ${errText}`)
    }

    const userData = (await userRes.json()) as {
      sub: string
      email: string
      name?: string
      picture?: string
    }

    const userProfile: UserProfile = {
      provider: 'google',
      providerAccountId: userData.sub,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0] || 'Usuário Google',
      picture: userData.picture,
    }

    return { tokens, userProfile }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
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
      throw new Error(`Falha ao renovar access token do Google (${res.status}): ${errText}`)
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
