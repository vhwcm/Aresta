import { ref } from 'vue'
import { useOAuth } from './useOAuth'
import { GoogleDriveStorageProvider } from '~/adapters/storage/cloud/GoogleDriveStorageProvider'
import type {
  UploadBookPackageOptions,
  UploadBookPackageResult,
  DownloadBookPackageOptions,
  DownloadBookPackageResult,
} from '~/adapters/storage/cloud/ICloudStorageProvider'

export interface GoogleDriveSyncResult {
  synced: boolean
  package?: UploadBookPackageResult
  error?: string
}

export const useGoogleDriveSync = () => {
  const { googleDriveToken, isGoogleDriveConnected, ensureGoogleDriveToken, refreshGoogleToken, setGoogleDriveToken } = useOAuth()
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
    let token = await ensureGoogleDriveToken()
    if (!token) return []
    try {
      let provider = new GoogleDriveStorageProvider(() => token)
      try {
        return await provider.listBooks()
      } catch (firstErr: any) {
        const isAuthError =
          firstErr?.message?.includes('401') ||
          firstErr?.message?.includes('Unauthorized') ||
          firstErr?.message?.includes('Invalid Credentials')

        if (isAuthError) {
          const refreshed = await refreshGoogleToken()
          if (refreshed) {
            token = refreshed
            provider = new GoogleDriveStorageProvider(() => token)
            return await provider.listBooks()
          } else {
            // Se o token expirou e não pode ser renovado, limpa o token stale para cessar erros 401
            setGoogleDriveToken(null)
            return []
          }
        }
        throw firstErr
      }
    } catch (err) {
      console.warn('[GoogleDriveSync] Falha ao listar livros do Google Drive:', err)
      return []
    }
  }

  const downloadBookFromDrive = async (options: {
    folderId?: string
    bookTitle?: string
  }): Promise<DownloadBookPackageResult | null> => {
    let token = await ensureGoogleDriveToken()
    if (!token) return null
    try {
      let provider = new GoogleDriveStorageProvider(() => token)
      try {
        return await provider.downloadBookFile(options)
      } catch (firstErr: any) {
        const isAuthError =
          firstErr?.message?.includes('401') ||
          firstErr?.message?.includes('Unauthorized') ||
          firstErr?.message?.includes('Invalid Credentials')

        if (isAuthError) {
          const refreshed = await refreshGoogleToken()
          if (refreshed) {
            token = refreshed
            provider = new GoogleDriveStorageProvider(() => token)
            return await provider.downloadBookFile(options)
          } else {
            setGoogleDriveToken(null)
            return null
          }
        }
        throw firstErr
      }
    } catch (err) {
      console.warn('[GoogleDriveSync] Falha ao baixar livro do Google Drive:', err)
      return null
    }
  }

  const downloadBookCoverFromDrive = async (folderId: string): Promise<Blob | null> => {
    let token = await ensureGoogleDriveToken()
    if (!token) return null
    try {
      let provider = new GoogleDriveStorageProvider(() => token)
      try {
        return await provider.downloadBookCover(folderId)
      } catch (firstErr: any) {
        const isAuthError =
          firstErr?.message?.includes('401') ||
          firstErr?.message?.includes('Unauthorized') ||
          firstErr?.message?.includes('Invalid Credentials')

        if (isAuthError) {
          const refreshed = await refreshGoogleToken()
          if (refreshed) {
            token = refreshed
            provider = new GoogleDriveStorageProvider(() => token)
            return await provider.downloadBookCover(folderId)
          } else {
            setGoogleDriveToken(null)
            return null
          }
        }
        throw firstErr
      }
    } catch (err) {
      console.warn('[GoogleDriveSync] Falha ao baixar capa do livro do Google Drive:', err)
      return null
    }
  }

  const deleteBookFromDrive = async (title: string, folderId?: string): Promise<boolean> => {
    let token = await ensureGoogleDriveToken()
    if (!token) return false
    try {
      const provider = new GoogleDriveStorageProvider(() => token)
      await provider.deleteBookFolder(title, folderId)
      return true
    } catch (err) {
      console.warn(`[GoogleDriveSync] Falha ao excluir livro "${title}" do Drive:`, err)
      return false
    }
  }

  const deleteAllDriveData = async (): Promise<boolean> => {
    let token = await ensureGoogleDriveToken()
    if (!token) return false
    try {
      const provider = new GoogleDriveStorageProvider(() => token)
      await provider.deleteAllArestaData()
      return true
    } catch (err) {
      console.warn('[GoogleDriveSync] Falha ao excluir todos os dados do Drive:', err)
      return false
    }
  }

  return {
    isSyncing,
    syncError,
    isGoogleDriveConnected,
    syncBookToDrive,
    listDriveBooks,
    downloadBookFromDrive,
    downloadBookCoverFromDrive,
    deleteBookFromDrive,
    deleteAllDriveData,
  }
}
