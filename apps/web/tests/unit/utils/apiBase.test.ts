import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getResolvedApiBase, getApiBase, getApiRoot, getStorageBaseUrl, getOAuthRedirectUri } from '../../../app/utils/apiBase'

describe('apiBase Utility (Same-Origin & CORS Handler)', () => {
  const originalLocation = window.location

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
    vi.unstubAllGlobals()
  })

  it('retorna http://localhost:3001 em ambiente de desenvolvimento local (localhost)', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
        origin: 'http://localhost:3000',
      },
      writable: true,
      configurable: true,
    })

    expect(getResolvedApiBase()).toBe('http://localhost:3001')
    expect(getApiBase()).toBe('http://localhost:3001/api')
    expect(getApiRoot()).toBe('http://localhost:3001')
    expect(getStorageBaseUrl()).toBe('http://localhost:3001/storage')
  })

  it('retorna string vazia (Same-Origin relativo) quando rodando em host remoto na AWS (DuckDNS ou IP)', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'aresta.duckdns.org',
        origin: 'https://aresta.duckdns.org',
      },
      writable: true,
      configurable: true,
    })

    // Mesmo se por acaso houver resíduo de localhost
    expect(getResolvedApiBase()).toBe('')
    expect(getApiBase()).toBe('/api')
    expect(getApiRoot()).toBe('')
    expect(getStorageBaseUrl()).toBe('/storage')
  })

  it('retorna Same-Origin relativo se rodando em IP público da AWS EC2', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: '54.232.120.45',
        origin: 'http://54.232.120.45',
      },
      writable: true,
      configurable: true,
    })

    expect(getResolvedApiBase()).toBe('')
    expect(getApiBase()).toBe('/api')
    expect(getApiRoot()).toBe('')
    expect(getStorageBaseUrl()).toBe('/storage')
  })

  it('respeita URL customizada remota válida se explicitamente configurada em runtimeConfig', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'aresta.duckdns.org',
        origin: 'https://aresta.duckdns.org',
      },
      writable: true,
      configurable: true,
    })

    // Mock useRuntimeConfig
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        apiUrl: 'https://api.custom.com/',
      },
    }))

    expect(getResolvedApiBase()).toBe('https://api.custom.com')
    expect(getApiBase()).toBe('https://api.custom.com/api')
    expect(getApiRoot()).toBe('https://api.custom.com')
    expect(getStorageBaseUrl()).toBe('https://api.custom.com/storage')
  })

  it('retorna https://aresta.duckdns.org quando rodando em ambiente Tauri APK/Desktop sem URL explicita', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'tauri.localhost',
        origin: 'https://tauri.localhost',
        protocol: 'https:',
      },
      writable: true,
      configurable: true,
    })

    expect(getResolvedApiBase()).toBe('https://aresta.duckdns.org')
    expect(getApiBase()).toBe('https://aresta.duckdns.org/api')
    expect(getApiRoot()).toBe('https://aresta.duckdns.org')
    expect(getStorageBaseUrl()).toBe('https://aresta.duckdns.org/storage')
  })

  it('retorna o redirect URI correto para OAuth em Web e no Tauri', () => {
    // 1. Web local
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
        origin: 'http://localhost:3000',
        protocol: 'http:',
      },
      writable: true,
      configurable: true,
    })
    expect(getOAuthRedirectUri()).toBe('http://localhost:3000/auth/callback')

    // 2. Web produção
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'aresta.duckdns.org',
        origin: 'https://aresta.duckdns.org',
        protocol: 'https:',
      },
      writable: true,
      configurable: true,
    })
    expect(getOAuthRedirectUri()).toBe('https://aresta.duckdns.org/auth/callback')

    // 3. Tauri APK / Native
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'tauri.localhost',
        origin: 'https://tauri.localhost',
        protocol: 'https:',
      },
      writable: true,
      configurable: true,
    })
    expect(getOAuthRedirectUri()).toBe('https://aresta.duckdns.org/auth/callback')
  })
})
