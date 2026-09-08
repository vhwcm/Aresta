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
  const { googleDriveToken, isGoogleDriveConnected, ensureGoogleDriveToken, refreshGoogleToken } = useOAuth()
  const isSyncing = ref(false)
  const syncError = ref<string | null>(null)

  const syncBookToDrive = async (
    options: UploadBookPackageOptions
  ): Promise<GoogleDriveSyncResult> => {
    // 1. Garante que o token esteja ativo (tenta obter do backend se necessário)
    let token = await ensureGoogleDriveToken()
    if (!token) {
      return { synced: false, error: 'Google Drive não conectado. Faça login com o Google.' }
    }

    isSyncing.value = true
    syncError.value = null

    try {
      let provider = new GoogleDriveStorageProvider(() => token)
      let result: UploadBookPackageResult

      try {
        result = await provider.uploadBookPackage(options)
      } catch (firstErr: any) {
        // Se falhou por token expirado (401), tenta renovar o token e repetir uma vez
        const isAuthError =
          firstErr?.message?.includes('401') ||
          firstErr?.message?.includes('Unauthorized') ||
          firstErr?.message?.includes('Invalid Credentials')

        if (isAuthError) {
          console.info('[GoogleDriveSync] Token expirado, renovando credenciais...')
          const refreshed = await refreshGoogleToken()
          if (refreshed) {
            token = refreshed
            provider = new GoogleDriveStorageProvider(() => token)
            result = await provider.uploadBookPackage(options)
          } else {
            throw firstErr
          }
        } else {
          throw firstErr
        }
      }

      return {
        synced: true,
        package: result,
      }
    } catch (err: any) {
      console.warn('[GoogleDriveSync] Falha ao sincronizar livro com Google Drive:', err)
      let msg = err?.message || 'Falha no envio para o Google Drive.'
      if (
        msg.includes('Google Drive API has not been used') ||
        msg.includes('disabled') ||
        msg.includes('accessNotConfigured') ||
        msg.includes('SERVICE_DISABLED')
      ) {
        msg =
          'A Google Drive API precisa ser ativada no seu Google Cloud Console (projeto 476318150003). Ative a API no console do Google para sincronizar.'
      }
      syncError.value = msg
      return {
        synced: false,
        error: msg,
      }
    } finally {
      isSyncing.value = false
    }
  }

  const listDriveBooks = async (): Promise<Array<{ title: string; folderId: string }>> => {
    const token = await ensureGoogleDriveToken()
    if (!token) return []
    try {
      const provider = new GoogleDriveStorageProvider(() => token)
      return await provider.listBooks()
    } catch (err) {
      console.warn('[GoogleDriveSync] Falha ao listar livros do Google Drive:', err)
      return []
    }
  }

  return {
    isSyncing,
    syncError,
    isGoogleDriveConnected,
    syncBookToDrive,
    listDriveBooks,
  }
}
