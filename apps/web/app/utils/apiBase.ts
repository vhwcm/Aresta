/**
 * Utilitário centralizado para resolução de URLs da API e Storage do Aresta Monolith.
 * Garante Same-Origin automático quando rodando no navegador em produção (AWS/Caddy),
 * e conecta automaticamente à API de produção (https://aresta.duckdns.org) quando
 * executando dentro de aplicativos nativos Tauri (Android APK, Desktop, etc.).
 */

export function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(
    ('__TAURI_INTERNALS__' in window) ||
    ('__TAURI__' in window) ||
    (window.location && window.location.hostname === 'tauri.localhost') ||
    (window.location && window.location.protocol === 'tauri:')
  )
}

export function getResolvedApiBase(): string {
  let configuredUrl = ''

  if (typeof useRuntimeConfig === 'function') {
    try {
      const config = useRuntimeConfig()
      configuredUrl = config?.public?.apiUrl || ''
    } catch {
      // Ignora quando chamado fora do contexto Nuxt
    }
  }

  // Ambiente de navegador ou WebView (cliente)
  if (typeof window !== 'undefined' && window.location) {
    const isTauri = isTauriEnvironment()

    // Se estiver rodando dentro do Tauri (Desktop ou Mobile Android APK)
    if (isTauri) {
      if (configuredUrl && !configuredUrl.includes('localhost') && !configuredUrl.includes('127.0.0.1')) {
        return configuredUrl.replace(/\/+$/, '')
      }
      return 'https://aresta.duckdns.org'
    }

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    // Se estiver em produção remota (AWS, DuckDNS, etc.)
    if (!isLocalhost) {
      // Se a URL configurada for localhost (resíduo de build) ou vazia, usa Same-Origin (string vazia)
      if (!configuredUrl || configuredUrl.includes('localhost') || configuredUrl.includes('127.0.0.1')) {
        return ''
      }
      return configuredUrl.replace(/\/+$/, '')
    }

    // Se estiver em localhost no navegador Web de desenvolvimento
    if (configuredUrl) {
      return configuredUrl.replace(/\/+$/, '')
    }
    return 'http://localhost:3001'
  }

  // Ambiente SSR / Node / Testes automatizados (Vitest)
  return configuredUrl ? configuredUrl.replace(/\/+$/, '') : 'http://localhost:3001'
}

/**
 * Retorna o endpoint base com o prefixo /api.
 * Exemplo:
 * - Em prod na AWS: "/api"
 * - No APK Android: "https://aresta.duckdns.org/api"
 * - Em dev local: "http://localhost:3001/api"
 */
export function getApiBase(): string {
  const base = getResolvedApiBase()
  return base ? `${base}/api` : '/api'
}

/**
 * Retorna o endpoint raiz da API para chamadas que já incluem /api no caminho.
 * Exemplo:
 * - Em prod na AWS: "" (gerando `${getApiRoot()}/api/auth/login` -> "/api/auth/login")
 * - No APK Android: "https://aresta.duckdns.org"
 * - Em dev local: "http://localhost:3001" (gerando "http://localhost:3001/api/auth/login")
 */
export function getApiRoot(): string {
  return getResolvedApiBase()
}

/**
 * Retorna a base para arquivos estáticos (/storage).
 */
export function getStorageBaseUrl(): string {
  const base = getResolvedApiBase()
  return base ? `${base}/storage` : '/storage'
}

/**
 * Retorna o Redirect URI autorizado para provedores OAuth (Google, Microsoft, etc.).
 * No Android/Tauri, utiliza o domínio web público seguro já registrado nos provedores OAuth.
 */
export function getOAuthRedirectUri(): string {
  if (typeof window !== 'undefined') {
    if (isTauriEnvironment()) {
      const apiRoot = getApiRoot()
      if (apiRoot && !apiRoot.includes('localhost') && !apiRoot.includes('127.0.0.1')) {
        return `${apiRoot}/auth/callback`
      }
      return 'https://aresta.duckdns.org/auth/callback'
    }
    return `${window.location.origin}/auth/callback`
  }
  return 'http://localhost:3000/auth/callback'
}
