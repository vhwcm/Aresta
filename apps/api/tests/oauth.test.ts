import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProviderFactory } from '../src/modules/auth/providers/AuthProviderFactory'
import { GoogleAuthProvider } from '../src/modules/auth/providers/GoogleAuthProvider'
import { MicrosoftAuthProvider } from '../src/modules/auth/providers/MicrosoftAuthProvider'
import { AppleAuthProvider } from '../src/modules/auth/providers/AppleAuthProvider'
import type { IAuthProvider } from '../src/modules/auth/providers/IAuthProvider'

describe('OAuth Providers & Factory (SOLID)', () => {
  beforeEach(() => {
    AuthProviderFactory.clearProviders()
  })

  it('should return GoogleAuthProvider when requested', () => {
    const provider = AuthProviderFactory.getProvider('google')
    expect(provider).toBeInstanceOf(GoogleAuthProvider)
    expect(provider.providerName).toBe('google')
  })

  it('should return MicrosoftAuthProvider when requested', () => {
    const provider = AuthProviderFactory.getProvider('microsoft')
    expect(provider).toBeInstanceOf(MicrosoftAuthProvider)
    expect(provider.providerName).toBe('microsoft')
  })

  it('should return AppleAuthProvider when requested', () => {
    const provider = AuthProviderFactory.getProvider('apple')
    expect(provider).toBeInstanceOf(AppleAuthProvider)
    expect(provider.providerName).toBe('apple')
  })

  it('should throw error for unsupported provider', () => {
    expect(() => AuthProviderFactory.getProvider('unsupported')).toThrow(
      /Provedor de autenticação não suportado/
    )
  })

  it('should allow registering a custom provider (Open/Closed Principle)', () => {
    const customProvider: IAuthProvider = {
      providerName: 'google', // or any key
      getAuthUrl: () => 'https://custom.auth/login',
      handleCallback: vi.fn(),
      refreshAccessToken: vi.fn(),
    }

    AuthProviderFactory.registerProvider(customProvider)
    const resolved = AuthProviderFactory.getProvider('google')
    expect(resolved.getAuthUrl()).toBe('https://custom.auth/login')
  })

  it('should construct Google auth URL with drive.file scope and redirectUri', () => {
    const google = new GoogleAuthProvider({
      clientId: 'test-google-id',
      clientSecret: 'test-google-secret',
      redirectUri: 'http://localhost:3000/callback',
    })

    const url = google.getAuthUrl('test-state', 'http://localhost:3000/callback')
    expect(url).toContain('accounts.google.com')
    expect(url).toContain('client_id=test-google-id')
    expect(url).toContain('drive.file')
    expect(url).toContain('state=test-state')
    expect(url).toContain('access_type=offline')
  })

  it('should construct Microsoft auth URL with OneDrive AppFolder scope', () => {
    const ms = new MicrosoftAuthProvider({
      clientId: 'test-ms-id',
      clientSecret: 'test-ms-secret',
      redirectUri: 'http://localhost:3000/callback',
    })

    const url = ms.getAuthUrl('state-ms')
    expect(url).toContain('login.microsoftonline.com')
    expect(url).toContain('client_id=test-ms-id')
    expect(url).toContain('Files.ReadWrite.AppFolder')
    expect(url).toContain('state=state-ms')
  })

  it('should construct Apple auth URL', () => {
    const apple = new AppleAuthProvider({
      clientId: 'com.aresta.app',
      redirectUri: 'http://localhost:3000/callback',
    })

    const url = apple.getAuthUrl('state-apple')
    expect(url).toContain('appleid.apple.com/auth/authorize')
    expect(url).toContain('client_id=com.aresta.app')
    expect(url).toContain('state=state-apple')
  })
})
