import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSettings } from '~/composables/useSettings'
import { useSettingsModal } from '~/composables/useSettingsModal'

const mockFetch = vi.fn()
;(globalThis as any).$fetch = mockFetch

const mockToken = vi.fn<() => string | null>(() => null)
vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    token: { value: mockToken() },
    isLoggedIn: { value: !!mockToken() },
  }),
}))

describe('useSettings Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.mockReturnValue(null)
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
  })

  it('inicia com valores padrão e permite alterar a preferência de animação', () => {
    const { pageAnimationEnabled, setPageAnimationEnabled } = useSettings()

    expect(pageAnimationEnabled.value).toBe(true)

    setPageAnimationEnabled(false)
    expect(pageAnimationEnabled.value).toBe(false)

    setPageAnimationEnabled(true)
    expect(pageAnimationEnabled.value).toBe(true)
  })

  it('persiste animação no localStorage', () => {
    const { setPageAnimationEnabled } = useSettings()

    setPageAnimationEnabled(false)

    const saved = JSON.parse(localStorage.getItem('aresta_settings') || '{}')
    expect(saved.pageAnimationEnabled).toBe(false)
  })

  it('permite alterar e obter o idioma', () => {
    const { language, setLanguage } = useSettings()

    expect(language.value).toBe('pt-BR')

    setLanguage('en-US')
    expect(language.value).toBe('en-US')
  })

  it('carrega configurações do servidor quando autenticado', async () => {
    mockToken.mockReturnValue('token-abc')
    mockFetch.mockResolvedValueOnce({
      userId: 1,
      pageAnimationEnabled: false,
      language: 'en-US',
    })

    const { loadFromServer, pageAnimationEnabled, language } = useSettings()
    await loadFromServer()

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7070/api/user-settings', {
      headers: { Authorization: 'Bearer token-abc' },
    })
    expect(pageAnimationEnabled.value).toBe(false)
    expect(language.value).toBe('en-US')
  })

  it('envia alteração para o servidor quando autenticado', async () => {
    mockToken.mockReturnValue('token-abc')
    mockFetch.mockResolvedValueOnce({
      userId: 1,
      pageAnimationEnabled: false,
      language: 'pt-BR',
    })

    const { setPageAnimationEnabled, setLanguage } = useSettings()
    setLanguage('pt-BR')
    setPageAnimationEnabled(false)

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:7070/api/user-settings', {
        method: 'PUT',
        headers: { Authorization: 'Bearer token-abc' },
        body: { pageAnimationEnabled: false, language: 'pt-BR' },
      })
    })
  })
})

describe('useSettingsModal Composable', () => {
  it('gerencia o estado de abertura e fechamento do painel', () => {
    const { isOpen, open, close, toggle } = useSettingsModal()

    close()
    expect(isOpen.value).toBe(false)

    open()
    expect(isOpen.value).toBe(true)

    toggle()
    expect(isOpen.value).toBe(false)

    toggle()
    expect(isOpen.value).toBe(true)

    close()
    expect(isOpen.value).toBe(false)
  })
})
