import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useOAuth } from '~/composables/useOAuth'

describe('useOAuth Composable', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve gerenciar estado de token do Google Drive corretamente', () => {
    const { isGoogleDriveConnected, setGoogleDriveToken, getCloudToken } = useOAuth()

    expect(isGoogleDriveConnected.value).toBe(false)
    expect(getCloudToken('google')).toBeNull()

    setGoogleDriveToken('fake-token-123')
    expect(isGoogleDriveConnected.value).toBe(true)
    expect(getCloudToken('google')).toBe('fake-token-123')

    setGoogleDriveToken(null)
    expect(isGoogleDriveConnected.value).toBe(false)
    expect(getCloudToken('google')).toBeNull()
  })

  it('deve armazenar token do OneDrive corretamente', () => {
    const { setOneDriveToken, getCloudToken } = useOAuth()

    setOneDriveToken('ms-token-456')
    expect(getCloudToken('onedrive')).toBe('ms-token-456')

    setOneDriveToken(null)
    expect(getCloudToken('onedrive')).toBeNull()
  })

  it('purgeClientSession deve limpar aresta_graph_meta e chaves aresta_* do localStorage', async () => {
    const { purgeClientSession } = await import('~/composables/useAuth')
    localStorage.setItem('aresta_graph_meta', JSON.stringify({ themes: [{ name: 'Programação' }], edges: [] }))
    localStorage.setItem('aresta_settings', JSON.stringify({ theme: 'dark' }))
    localStorage.setItem('aresta_drive_sync_device_id', 'dev-123')
    localStorage.setItem('unrelated_key', 'keep_me')

    await purgeClientSession()

    expect(localStorage.getItem('aresta_graph_meta')).toBeNull()
    expect(localStorage.getItem('aresta_settings')).toBeNull()
    expect(localStorage.getItem('aresta_drive_sync_device_id')).toBeNull()
    expect(localStorage.getItem('unrelated_key')).toBe('keep_me')
  })
})
