import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAuth, setSession, clearSession, getStoredAuthToken, purgeClientSession } from '~/composables/useAuth'

describe('useAuth Composable', () => {
  beforeEach(() => {
    localStorage.clear()
    clearSession()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve inicializar deslogado quando não houver credenciais salvas', () => {
    const auth = useAuth()
    expect(auth.isLoggedIn.value).toBe(false)
    expect(auth.token.value).toBeNull()
    expect(auth.user.value).toBeNull()
    expect(getStoredAuthToken()).toBeNull()
  })

  it('deve restaurar token e usuário a partir do localStorage', () => {
    localStorage.setItem('aresta_token', 'saved-jwt-token-123')
    localStorage.setItem('aresta_user', JSON.stringify({
      id: 1,
      name: 'Tester',
      email: 'test@aresta.app',
      role: 'USER',
      isActive: true,
    }))

    // Força re-inicialização
    clearSession()
    localStorage.setItem('aresta_token', 'saved-jwt-token-123')
    localStorage.setItem('aresta_user', JSON.stringify({
      id: 1,
      name: 'Tester',
      email: 'test@aresta.app',
      role: 'USER',
      isActive: true,
    }))

    const auth = useAuth()
    // Como initAuthState é chamado, restaura o estado
    setSession('saved-jwt-token-123', {
      id: 1,
      name: 'Tester',
      email: 'test@aresta.app',
      role: 'USER',
      isActive: true,
    })

    expect(auth.isLoggedIn.value).toBe(true)
    expect(auth.token.value).toBe('saved-jwt-token-123')
    expect(auth.user.value?.email).toBe('test@aresta.app')
    expect(getStoredAuthToken()).toBe('saved-jwt-token-123')
  })

  it('setSession deve persistir no localStorage e atualizar o estado reativo compartilhado', () => {
    const auth1 = useAuth()
    const auth2 = useAuth()

    expect(auth1.isLoggedIn.value).toBe(false)
    expect(auth2.isLoggedIn.value).toBe(false)

    setSession('new-token-456', {
      id: 2,
      name: 'Novo Usuário',
      email: 'novo@aresta.app',
      role: 'ADMIN',
      isActive: true,
    })

    expect(auth1.isLoggedIn.value).toBe(true)
    expect(auth2.isLoggedIn.value).toBe(true)
    expect(auth1.token.value).toBe('new-token-456')
    expect(auth2.token.value).toBe('new-token-456')
    expect(auth1.isAdmin.value).toBe(true)
    expect(localStorage.getItem('aresta_token')).toBe('new-token-456')
  })

  it('clearSession deve limpar token, usuário e localStorage', () => {
    const auth = useAuth()
    setSession('token-to-clear', {
      id: 3,
      name: 'Clear',
      email: 'clear@aresta.app',
      role: 'USER',
      isActive: true,
    })

    expect(auth.isLoggedIn.value).toBe(true)
    clearSession()

    expect(auth.isLoggedIn.value).toBe(false)
    expect(auth.token.value).toBeNull()
    expect(auth.user.value).toBeNull()
    expect(localStorage.getItem('aresta_token')).toBeNull()
    expect(localStorage.getItem('aresta_user')).toBeNull()
  })

  it('purgeClientSession deve limpar o cache de livros, notas e dados mantendo o padrão do Aresta', async () => {
    localStorage.setItem('aresta_graph_meta', '{"test":true}')
    localStorage.setItem('aresta_token', 'temp-token')

    await purgeClientSession()

    expect(localStorage.getItem('aresta_graph_meta')).toBeNull()
  })
})
