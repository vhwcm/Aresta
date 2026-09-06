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
})
