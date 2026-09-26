import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useDriveSync } from '~/composables/useDriveSync'

const mockToken = ref<string | null>('valid-auth-token')
const mockIsLoggedIn = ref(true)

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    token: mockToken,
    isLoggedIn: mockIsLoggedIn,
  }),
}))

const mockRefreshCloudToken = vi.fn().mockResolvedValue('refreshed-google-token')
const mockConnectDriveOnly = vi.fn().mockResolvedValue({ success: true })
const mockDisconnectDriveOnly = vi.fn().mockResolvedValue({ success: true })

vi.mock('~/composables/useOAuth', () => ({
  useOAuth: () => ({
    refreshCloudToken: mockRefreshCloudToken,
    connectDriveOnly: mockConnectDriveOnly,
    disconnectDriveOnly: mockDisconnectDriveOnly,
  }),
}))

const mockFetchGraph = vi.fn().mockResolvedValue(undefined)
const mockFetchUserBooks = vi.fn().mockResolvedValue(undefined)
const mockFetchCanvases = vi.fn().mockResolvedValue(undefined)
const mockFetchNotes = vi.fn().mockResolvedValue(undefined)
const mockFetchDrawings = vi.fn().mockResolvedValue(undefined)
const mockFetchLinks = vi.fn().mockResolvedValue(undefined)
const mockLoadTimeline = vi.fn().mockResolvedValue(undefined)

vi.mock('~/composables/useGraph', () => ({
  useGraph: () => ({ fetchGraph: mockFetchGraph }),
}))

vi.mock('~/composables/useUserBooks', () => ({
  useUserBooks: () => ({ fetchUserBooks: mockFetchUserBooks }),
}))

vi.mock('~/composables/useCanvas', () => ({
  useCanvas: () => ({ fetchCanvases: mockFetchCanvases }),
}))

vi.mock('~/composables/useNotes', () => ({
  useNotes: () => ({ fetchNotes: mockFetchNotes }),
}))

vi.mock('~/composables/useDrawing', () => ({
  useDrawing: () => ({ fetchDrawings: mockFetchDrawings }),
}))

vi.mock('~/composables/useLinks', () => ({
  useLinks: () => ({ fetchLinks: mockFetchLinks }),
}))

vi.mock('~/composables/useJournal', () => ({
  useJournal: () => ({ loadTimeline: mockLoadTimeline }),
}))

const mockFullSync = vi.fn().mockResolvedValue({
  results: [],
  syncedAt: '2026-09-19T18:40:00.000Z',
})

vi.mock('~/services/DriveSyncService', () => ({
  DriveSyncService: class {
    fullSync = mockFullSync
  },
}))

vi.mock('~/adapters/storage/cloud/CloudStorageProviderFactory', () => ({
  CloudStorageProviderFactory: {
    getProvider: vi.fn().mockReturnValue({ providerName: 'google' }),
  },
}))

describe('useDriveSync Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('aresta_drive_provider', 'google')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve formatar data de sincronização e expor propriedades reativas', async () => {
    const { connect, isConnected, isSyncing, lastSyncFormatted } = useDriveSync()
    await connect('google')
    expect(isConnected.value).toBe(true)
    expect(isSyncing.value).toBe(false)
    expect(lastSyncFormatted.value).toBeDefined()
  })

  it('revalidateAllStores deve chamar todas as stores e disparar evento aresta:data-synced', async () => {
    const { revalidateAllStores } = useDriveSync()
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await revalidateAllStores()

    expect(mockFetchGraph).toHaveBeenCalled()
    expect(mockFetchUserBooks).toHaveBeenCalled()
    expect(mockFetchCanvases).toHaveBeenCalled()
    expect(mockFetchNotes).toHaveBeenCalled()
    expect(mockFetchDrawings).toHaveBeenCalled()
    expect(mockFetchLinks).toHaveBeenCalled()
    expect(mockLoadTimeline).toHaveBeenCalled()
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'aresta:data-synced' }))
  })

  it('sync deve executar fullSync e revalidar stores', async () => {
    const { sync, isSyncing } = useDriveSync()
    const syncPromise = sync()
    expect(isSyncing.value).toBe(true)
    await syncPromise
    expect(isSyncing.value).toBe(false)
    expect(mockFullSync).toHaveBeenCalled()
    expect(mockFetchGraph).toHaveBeenCalled()
  })

  it('initListeners deve registrar listeners de online, visibilitychange, focus e storage', () => {
    const addEventSpy = vi.spyOn(window, 'addEventListener')
    const { initListeners } = useDriveSync()

    initListeners()

    expect(addEventSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(addEventSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(addEventSpy).toHaveBeenCalledWith('focus', expect.any(Function))
    expect(addEventSpy).toHaveBeenCalledWith('storage', expect.any(Function))
  })
})
