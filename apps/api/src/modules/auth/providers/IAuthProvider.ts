export interface OAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  tokenType?: string
  scope?: string
  idToken?: string
}

export interface UserProfile {
  provider: 'google' | 'microsoft' | 'apple'
  providerAccountId: string
  email: string
  name: string
  picture?: string
}

export interface IAuthProvider {
  readonly providerName: 'google' | 'microsoft' | 'apple'
  getAuthUrl(state?: string, redirectUri?: string): string
  handleCallback(code: string, redirectUri?: string): Promise<{ tokens: OAuthTokens; userProfile: UserProfile }>
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>
}
