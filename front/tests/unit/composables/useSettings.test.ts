import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettings, resetSettingsForTesting } from '~/composables/useSettings'
import { useSettingsModal } from '~/composables/useSettingsModal'
import { useReaderStore } from '~/stores/readerStore'

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
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockToken.mockReturnValue(null)
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    resetSettingsForTesting()
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

  it('inicia com valores padrão e permite alterar a preferência de vinco central (duas páginas)', () => {
    const { pageCreaseEnabled, setPageCreaseEnabled } = useSettings()

    expect(pageCreaseEnabled.value).toBe(true)

    setPageCreaseEnabled(false)
    expect(pageCreaseEnabled.value).toBe(false)

    const saved = JSON.parse(localStorage.getItem('aresta_settings') || '{}')
    expect(saved.pageCreaseEnabled).toBe(false)
    expect(localStorage.getItem('aresta_reader_page_crease')).toBe('false')

    setPageCreaseEnabled(true)
    expect(pageCreaseEnabled.value).toBe(true)
  })

  it('desativa pageCreaseEnabled e impede ativação se pageAnimationEnabled for falso', () => {
    const { pageAnimationEnabled, pageCreaseEnabled, canEnablePageCrease, setPageAnimationEnabled, setPageCreaseEnabled } = useSettings()

    expect(canEnablePageCrease.value).toBe(true)
    expect(pageCreaseEnabled.value).toBe(true)

    // Desativa animação 3D
    setPageAnimationEnabled(false)
    expect(pageAnimationEnabled.value).toBe(false)
    expect(pageCreaseEnabled.value).toBe(false)
    expect(canEnablePageCrease.value).toBe(false)

    // Tenta ativar vinco com animação desligada
    setPageCreaseEnabled(true)
    expect(pageCreaseEnabled.value).toBe(false)

    // Reativa animação 3D
    setPageAnimationEnabled(true)
    expect(canEnablePageCrease.value).toBe(true)
    setPageCreaseEnabled(true)
    expect(pageCreaseEnabled.value).toBe(true)
  })

  it('permite alterar e obter o idioma', () => {
    const { language, setLanguage } = useSettings()

    expect(language.value).toBe('pt-BR')

    setLanguage('en-US')
    expect(language.value).toBe('en-US')
  })

  it('permite alterar e obter o tema visual (dark/light/sepia)', () => {
    const { themeMode, setThemeMode, toggleThemeMode } = useSettings()

    expect(themeMode.value).toBe('light')

    setThemeMode('dark')
    expect(themeMode.value).toBe('dark')
    let saved = JSON.parse(localStorage.getItem('aresta_settings') || '{}')
    expect(saved.themeMode).toBe('dark')

    setThemeMode('sepia')
    expect(themeMode.value).toBe('sepia')
    saved = JSON.parse(localStorage.getItem('aresta_settings') || '{}')
    expect(saved.themeMode).toBe('sepia')

    // toggleThemeMode cycles: sepia -> dark -> light -> sepia
    toggleThemeMode()
    expect(themeMode.value).toBe('dark')

    toggleThemeMode()
    expect(themeMode.value).toBe('light')

    toggleThemeMode()
    expect(themeMode.value).toBe('sepia')
  })

  it('permite alterar e obter o tema de fundo de leitura independente', () => {
    const { readerTheme, setReaderTheme } = useSettings()

    expect(readerTheme.value).toBe('sepia')

    setReaderTheme('white')
    expect(readerTheme.value).toBe('white')
    expect(localStorage.getItem('aresta_reader_theme')).toBe('white')

    setReaderTheme('black')
    expect(readerTheme.value).toBe('black')
    expect(localStorage.getItem('aresta_reader_theme')).toBe('black')

    setReaderTheme('sepia')
    expect(readerTheme.value).toBe('sepia')
    expect(localStorage.getItem('aresta_reader_theme')).toBe('sepia')
  })

  it('permite alternar a preferência de grafo na tela inicial desktop', () => {
    const { desktopHomeGraphOpen, setDesktopHomeGraphOpen } = useSettings()

    expect(desktopHomeGraphOpen.value).toBe(false)

    setDesktopHomeGraphOpen(true)
    expect(desktopHomeGraphOpen.value).toBe(true)
    const saved = JSON.parse(localStorage.getItem('aresta_settings') || '{}')
    expect(saved.desktopHomeGraphOpen).toBe(true)
  })

  it('permite alterar e obter a família tipográfica padrão de EPUB', () => {
    const { epubFontFamily, setEpubFontFamily } = useSettings()

    expect(epubFontFamily.value).toBe('newsreader')

    setEpubFontFamily('merriweather')
    expect(epubFontFamily.value).toBe('merriweather')
    const saved = JSON.parse(localStorage.getItem('aresta_settings') || '{}')
    expect(saved.epubFontFamily).toBe('merriweather')
  })

  it('carrega configurações do servidor quando autenticado', async () => {
    mockToken.mockReturnValue('token-abc')
    mockFetch.mockResolvedValueOnce({
      userId: 1,
      pageAnimationEnabled: false,
      pageCreaseEnabled: false,
      language: 'en-US',
      epubFontSize: 22,
      epubFontFamily: 'literata',
      themeMode: 'light',
      desktopHomeGraphOpen: false,
    })

    const { loadFromServer, pageAnimationEnabled, pageCreaseEnabled, language, themeMode, desktopHomeGraphOpen, epubFontFamily } = useSettings()
    await loadFromServer()

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7070/api/user-settings', {
      headers: { Authorization: 'Bearer token-abc' },
    })
    expect(pageAnimationEnabled.value).toBe(false)
    expect(pageCreaseEnabled.value).toBe(false)
    expect(language.value).toBe('en-US')
    expect(themeMode.value).toBe('light')
    expect(desktopHomeGraphOpen.value).toBe(false)
    expect(epubFontFamily.value).toBe('literata')
  })

  it('envia alteração para o servidor quando autenticado', async () => {
    mockToken.mockReturnValue('token-abc')
    mockFetch.mockResolvedValueOnce({
      userId: 1,
      pageAnimationEnabled: false,
      pageCreaseEnabled: false,
      language: 'pt-BR',
    })

    const { setPageAnimationEnabled, setPageCreaseEnabled, setLanguage } = useSettings()
    setLanguage('pt-BR')
    setPageAnimationEnabled(false)
    setPageCreaseEnabled(false)

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:7070/api/user-settings', {
        method: 'PUT',
        headers: { Authorization: 'Bearer token-abc' },
        body: expect.objectContaining({
          pageAnimationEnabled: false,
          pageCreaseEnabled: false,
          language: 'pt-BR',
          epubFontSize: 18,
          epubFontFamily: 'newsreader',
        }),
      })
    })
  })

  it('permite alterar e obter o tamanho da fonte de EPUB com persistência e sincronia com readerStore', () => {
    const readerStore = useReaderStore()
    const { epubFontSize, setEpubFontSize } = useSettings()

    expect(epubFontSize.value).toBe(18)
    expect(readerStore.fontSize).toBe(18)

    setEpubFontSize(24)
    expect(epubFontSize.value).toBe(24)
    expect(readerStore.fontSize).toBe(24)

    const saved = JSON.parse(localStorage.getItem('aresta_settings') || '{}')
    expect(saved.epubFontSize).toBe(24)

    // Clamping entre 12 e 36
    setEpubFontSize(8)
    expect(epubFontSize.value).toBe(12)
    expect(readerStore.fontSize).toBe(12)

    setEpubFontSize(50)
    expect(epubFontSize.value).toBe(36)
    expect(readerStore.fontSize).toBe(36)
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
