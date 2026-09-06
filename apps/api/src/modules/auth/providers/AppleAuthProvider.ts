import type { IAuthProvider, OAuthTokens, UserProfile } from './IAuthProvider'

export interface AppleAuthConfig {
  clientId?: string
  teamId?: string
  keyId?: string
  privateKey?: string
  redirectUri?: string
  scopes?: string[]
}

export class AppleAuthProvider implements IAuthProvider {
  readonly providerName = 'apple' as const
  private clientId: string
  private defaultRedirectUri: string
  private scopes: string[]

  constructor(config?: AppleAuthConfig) {
    this.clientId = config?.clientId || process.env.APPLE_CLIENT_ID || 'mock-apple-client-id'
    this.defaultRedirectUri =
      config?.redirectUri ||
      process.env.APPLE_REDIRECT_URI ||
      'http://localhost:3000/auth/callback'
    this.scopes = config?.scopes || ['name', 'email']
  }

  getAuthUrl(state?: string, redirectUri?: string): string {
    const targetRedirect = redirectUri || this.defaultRedirectUri
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: targetRedirect,
      response_type: 'code',
      response_mode: 'query',
      scope: this.scopes.join(' '),
      ...(state ? { state } : {}),
    })

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`
  }

  async handleCallback(code: string, redirectUri?: string): Promise<{ tokens: OAuthTokens; userProfile: UserProfile }> {
    const targetRedirect = redirectUri || this.defaultRedirectUri

    const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: process.env.APPLE_CLIENT_SECRET || 'mock-apple-secret',
        code,
        grant_type: 'authorization_code',
        redirect_uri: targetRedirect,
      }).toString(),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      throw new Error(`Falha ao obter tokens da Apple (${tokenRes.status}): ${errText}`)
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string
      refresh_token?: string
      expires_in?: number
      token_type?: string
      id_token?: string
    }

    // Decodifica o payload do id_token (JWT) para obter o sub e email
    let email = 'usuario@apple.id'
    let sub = `apple_${Date.now()}`

    if (tokenData.id_token) {
      try {
        const parts = tokenData.id_token.split('.')
        if (parts[1]) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
          if (payload.sub) sub = payload.sub
          if (payload.email) email = payload.email
        }
      } catch {
        // Fallback se decodificação base64 falhar
      }
    }

    const tokens: OAuthTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      idToken: tokenData.id_token,
    }

    const userProfile: UserProfile = {
      provider: 'apple',
      providerAccountId: sub,
      email,
      name: email.split('@')[0] || 'Usuário Apple',
    }

    return { tokens, userProfile }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const res = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: process.env.APPLE_CLIENT_SECRET || 'mock-apple-secret',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Falha ao renovar access token da Apple (${res.status}): ${errText}`)
    }

    const data = (await res.json()) as {
      access_token: string
      expires_in?: number
      token_type?: string
    }

    return {
      accessToken: data.access_token,
      refreshToken,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    }
  }
}
