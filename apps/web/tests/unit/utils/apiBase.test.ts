import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getResolvedApiBase, getApiBase, getApiRoot, getStorageBaseUrl } from '../../../app/utils/apiBase'

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
})
