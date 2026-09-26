import { computed, onMounted, onUnmounted, ref } from 'vue'
import { CloudStorageProviderFactory, type SupportedCloudStorage } from '~/adapters/storage/cloud/CloudStorageProviderFactory'
import type { IDataSyncProvider } from '~/adapters/storage/cloud/IDataSyncProvider'
import { DriveSyncService } from '~/services/DriveSyncService'
import { useAuth } from './useAuth'
import { useOAuth } from './useOAuth'

const PROVIDER_KEY = 'aresta_drive_provider'
const isSyncing = ref(false)
const lastSyncAt = ref<string | null>(typeof localStorage !== 'undefined' ? localStorage.getItem('aresta_drive_last_sync') : null)
const pendingCount = ref(0)
const driveProvider = ref<SupportedCloudStorage | null>(typeof localStorage !== 'undefined' ? localStorage.getItem(PROVIDER_KEY) as SupportedCloudStorage | null : null)
const syncError = ref<string | null>(null)
let interval: ReturnType<typeof setInterval> | null = null
let listenersAttached = false
let syncBroadcastChannel: BroadcastChannel | null = null

export function useDriveSync() {
  const auth = useAuth()
  const oauth = useOAuth()
  const isConnected = computed(() => !!driveProvider.value)

  const lastSyncFormatted = computed(() => {
    if (!lastSyncAt.value) return null
    try {
      const d = new Date(lastSyncAt.value)
      if (isNaN(d.getTime())) return null
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return null
    }
  })

  const updatePendingCount = async () => {
    try {
      const { mutationQueueService } = await import('~/services/MutationQueueService')
      pendingCount.value = await mutationQueueService.getPendingCount()
    } catch {
      pendingCount.value = 0
    }
  }

  const revalidateAllStores = async () => {
    try {
      const [
        { useUserBooks },
        { useGraph },
        { useCanvas },
        { useNotes },
        { useDrawing },
        { useLinks },
        { useJournal }
      ] = await Promise.all([
        import('./useUserBooks'),
        import('./useGraph'),
        import('./useCanvas'),
        import('./useNotes'),
        import('./useDrawing'),
        import('./useLinks'),
        import('./useJournal')
      ])

      await Promise.all([
        useUserBooks().fetchUserBooks().catch(() => {}),
        useGraph().fetchGraph().catch(() => {}),
        useCanvas().fetchCanvases().catch(() => {}),
        useNotes().fetchNotes().catch(() => {}),
        useDrawing().fetchDrawings().catch(() => {}),
        useLinks().fetchLinks().catch(() => {}),
        useJournal().loadTimeline().catch(() => {})
      ])

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aresta:data-synced', {
          detail: { timestamp: new Date().toISOString() }
        }))
      }
    } catch (err) {
      console.warn('[useDriveSync] Falha ao revalidar stores:', err)
    }
  }

  const resolveProvider = async (): Promise<IDataSyncProvider | null> => {
    if (!driveProvider.value) {
      if (auth.token.value) {
        const googleToken = await oauth.refreshCloudToken('google')
        if (googleToken) {
          driveProvider.value = 'google'
          if (typeof localStorage !== 'undefined') localStorage.setItem(PROVIDER_KEY, 'google')
          return CloudStorageProviderFactory.getProvider('google', googleToken) as IDataSyncProvider
        }
        const onedriveToken = await oauth.refreshCloudToken('onedrive')
        if (onedriveToken) {
          driveProvider.value = 'onedrive'
          if (typeof localStorage !== 'undefined') localStorage.setItem(PROVIDER_KEY, 'onedrive')
          return CloudStorageProviderFactory.getProvider('onedrive', onedriveToken) as IDataSyncProvider
        }
      }
      return null
    }
    if (driveProvider.value === 'icloud-folder') {
      return CloudStorageProviderFactory.getProvider('icloud-folder', '') as IDataSyncProvider
    }
    if (!auth.token.value) return null
    const token = await oauth.refreshCloudToken(driveProvider.value)
    if (!token) return null
    return CloudStorageProviderFactory.getProvider(driveProvider.value, token) as IDataSyncProvider
  }

  const sync = async () => {
    if (isSyncing.value || (typeof navigator !== 'undefined' && !navigator.onLine)) return
    isSyncing.value = true
    syncError.value = null
    try {
      const provider = await resolveProvider()
      if (!provider) return
      const summary = await new DriveSyncService(provider).fullSync()
      lastSyncAt.value = summary.syncedAt
      pendingCount.value = 0
      if (typeof localStorage !== 'undefined') localStorage.setItem('aresta_drive_last_sync', summary.syncedAt)

      // Revalida todas as stores do ecossistema reativamente
      await revalidateAllStores()

      // Notifica outras abas/janelas via BroadcastChannel
      if (syncBroadcastChannel) {
        try {
          syncBroadcastChannel.postMessage({ type: 'SYNC_COMPLETED', timestamp: summary.syncedAt })
        } catch {}
      }
    } catch (error: any) {
      syncError.value = error?.message || 'Não foi possível sincronizar com o Drive.'
    } finally {
      isSyncing.value = false
      void updatePendingCount()
    }
  }

  const connect = async (provider: SupportedCloudStorage) => {
    if (provider === 'icloud-folder') {
      driveProvider.value = provider
      if (typeof localStorage !== 'undefined') localStorage.setItem(PROVIDER_KEY, provider)
      await sync()
      return
    }

    const result = await oauth.connectDriveOnly(provider === 'onedrive' ? 'microsoft' : 'google')
    if (!result.success) throw new Error(result.error || 'Falha ao conectar o Drive.')
    driveProvider.value = provider
    if (typeof localStorage !== 'undefined') localStorage.setItem(PROVIDER_KEY, provider)
    await sync()
  }

  const disconnect = async () => {
    if (driveProvider.value === 'google' || driveProvider.value === 'onedrive') {
      await oauth.disconnectDriveOnly(driveProvider.value === 'onedrive' ? 'microsoft' : 'google')
    }
    driveProvider.value = null
    if (typeof localStorage !== 'undefined') localStorage.removeItem(PROVIDER_KEY)
  }

  const handleOnline = () => {
    void sync()
  }

  const handleVisibilityOrFocus = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      void sync()
    }
  }

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'aresta_drive_last_sync' || e.key === 'aresta_last_sync_timestamp') {
      void revalidateAllStores()
    }
  }

  const initListeners = () => {
    if (typeof window === 'undefined' || listenersAttached) return
    listenersAttached = true
    window.addEventListener('online', handleOnline)
    window.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('focus', handleVisibilityOrFocus)
    window.addEventListener('storage', handleStorageChange)

    if (typeof BroadcastChannel !== 'undefined' && !syncBroadcastChannel) {
      try {
        syncBroadcastChannel = new BroadcastChannel('aresta_sync_channel')
        syncBroadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_COMPLETED') {
            void revalidateAllStores()
          }
        }
      } catch {}
    }

    // Polling adaptativo dinâmico a cada 25 segundos se o documento estiver visível
    interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && !isSyncing.value) {
        void sync()
      }
    }, 25 * 1000)

    void updatePendingCount()
  }

  const dispose = () => {
    if (typeof window === 'undefined' || !listenersAttached) return
    listenersAttached = false
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('visibilitychange', handleVisibilityOrFocus)
    window.removeEventListener('focus', handleVisibilityOrFocus)
    window.removeEventListener('storage', handleStorageChange)
    if (interval) clearInterval(interval)
    interval = null
    if (syncBroadcastChannel) {
      try {
        syncBroadcastChannel.close()
      } catch {}
      syncBroadcastChannel = null
    }
  }

  onMounted(initListeners)
  onUnmounted(dispose)

  return {
    isSyncing,
    lastSyncAt,
    lastSyncFormatted,
    pendingCount,
    driveProvider,
    syncError,
    isConnected,
    sync,
    triggerSync: sync,
    revalidateAllStores,
    connect,
    disconnect,
    initListeners,
  }
}

