import { ref } from 'vue'
import { useOAuth } from './useOAuth'
import { GoogleDriveStorageProvider } from '~/adapters/storage/cloud/GoogleDriveStorageProvider'
import type { UploadBookPackageOptions, UploadBookPackageResult } from '~/adapters/storage/cloud/ICloudStorageProvider'

export interface GoogleDriveSyncResult {
  synced: boolean
  package?: UploadBookPackageResult
  error?: string
}

export const useGoogleDriveSync = () => {
  const { googleDriveToken, isGoogleDriveConnected } = useOAuth()
  const isSyncing = ref(false)
  const syncError = ref<string | null>(null)

  const syncBookToDrive = async (
    options: UploadBookPackageOptions
  ): Promise<GoogleDriveSyncResult> => {
    if (!isGoogleDriveConnected.value || !googleDriveToken.value) {
      return { synced: false, error: 'Google Drive não conectado' }
    }

    isSyncing.value = true
    syncError.value = null

    try {
      const provider = new GoogleDriveStorageProvider(() => googleDriveToken.value)
      const result = await provider.uploadBookPackage(options)

      return {
        synced: true,
        package: result,
      }
    } catch (err: any) {
      console.warn('[GoogleDriveSync] Falha ao sincronizar livro com Google Drive:', err)
      const msg = err?.message || 'Falha no envio para o Google Drive.'
      syncError.value = msg
      return {
        synced: false,
        error: msg,
      }
    } finally {
      isSyncing.value = false
    }
  }

  return {
    isSyncing,
    syncError,
    isGoogleDriveConnected,
    syncBookToDrive,
  }
}
