/**
 * Utilitário centralizado para resolução de URLs da API e Storage do Aresta Monolith.
 * Garante Same-Origin automático quando rodando no navegador em produção (AWS/Caddy),
 * eliminando problemas de Cross-Origin (CORS) e Mixed Content.
 */

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

  // Ambiente de navegador (cliente)
  if (typeof window !== 'undefined' && window.location) {
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

    // Se estiver em localhost no navegador
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
 * - Em dev local: "http://localhost:3001" (gerando "http://localhost:3001/api/auth/login")
 */
export function getApiRoot(): string {
  return getResolvedApiBase()
}

/**
 * Retorna a base para arquivos estáticos (/storage).
 * Exemplo:
 * - Em prod na AWS: "/storage"
 * - Em dev local: "http://localhost:3001/storage"
 */
export function getStorageBaseUrl(): string {
  const base = getResolvedApiBase()
  return base ? `${base}/storage` : '/storage'
}
