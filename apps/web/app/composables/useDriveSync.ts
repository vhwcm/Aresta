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

export function useDriveSync() {
  const auth = useAuth()
  const oauth = useOAuth()
  const isConnected = computed(() => !!driveProvider.value)

  const resolveProvider = async (): Promise<IDataSyncProvider | null> => {
    if (!driveProvider.value || !auth.token.value) return null
    if (driveProvider.value === 'icloud-folder') return null
    const token = await oauth.refreshCloudToken(driveProvider.value)
    if (!token) return null
    return CloudStorageProviderFactory.getProvider(driveProvider.value, token) as IDataSyncProvider
  }

  const sync = async () => {
    if (isSyncing.value || (typeof navigator !== 'undefined' && !navigator.onLine)) return
    const provider = await resolveProvider()
    if (!provider) return
    isSyncing.value = true; syncError.value = null
    try {
      const summary = await new DriveSyncService(provider).fullSync()
      lastSyncAt.value = summary.syncedAt
      pendingCount.value = 0
      if (typeof localStorage !== 'undefined') localStorage.setItem('aresta_drive_last_sync', summary.syncedAt)
    } catch (error: any) {
      syncError.value = error?.message || 'Não foi possível sincronizar com o Drive.'
    } finally { isSyncing.value = false }
  }

  const connect = async (provider: Exclude<SupportedCloudStorage, 'icloud-folder'>) => {
    // O fluxo atual de OAuth também cria sessão. A rota de conexão autenticada
    // deverá substituir esta chamada quando o popup de vínculo dedicado existir.
    const result = await oauth.loginWithOAuth(provider === 'onedrive' ? 'microsoft' : 'google')
    if (!result.success) throw new Error(result.error || 'Falha ao conectar o Drive.')
    driveProvider.value = provider
    if (typeof localStorage !== 'undefined') localStorage.setItem(PROVIDER_KEY, provider)
    await sync()
  }
  const disconnect = () => {
    if (driveProvider.value === 'google') oauth.setGoogleDriveToken(null)
    if (driveProvider.value === 'onedrive') oauth.setOneDriveToken(null)
    driveProvider.value = null
    if (typeof localStorage !== 'undefined') localStorage.removeItem(PROVIDER_KEY)
  }

  const initListeners = () => {
    if (typeof window === 'undefined' || listenersAttached) return
    listenersAttached = true
    window.addEventListener('online', sync)
    window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void sync() })
    interval = setInterval(() => void sync(), 5 * 60 * 1000)
  }
  const dispose = () => {
    if (typeof window === 'undefined' || !listenersAttached) return
    listenersAttached = false
    window.removeEventListener('online', sync)
    if (interval) clearInterval(interval)
    interval = null
  }
  onMounted(initListeners); onUnmounted(dispose)

  return { isSyncing, lastSyncAt, pendingCount, driveProvider, syncError, isConnected, sync, connect, disconnect, initListeners }
}
