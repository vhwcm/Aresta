import type {
  ICloudStorageProvider,
  CloudFolderResult,
  CloudFileResult,
  UploadFileOptions,
  UploadBookPackageOptions,
  UploadBookPackageResult,
} from './ICloudStorageProvider'
import type { IDataSyncProvider, DataSubFolder, DataSyncResult } from './IDataSyncProvider'

export class OneDriveStorageProvider implements IDataSyncProvider {
  readonly providerName = 'onedrive' as const
  private getAccessToken: () => string | null
  private dataFolderId: string | null = null
  private subFolderIds: Partial<Record<DataSubFolder, string>> = {}

  constructor(accessTokenOrGetter: string | (() => string | null)) {
    if (typeof accessTokenOrGetter === 'function') {
      this.getAccessToken = accessTokenOrGetter
    } else {
      this.getAccessToken = () => accessTokenOrGetter
    }
  }

  private getAuthHeader(): Record<string, string> {
    const token = this.getAccessToken()
    if (!token) {
      throw new Error('Usuário não autenticado no OneDrive. Faça login com a conta Microsoft.')
    }
    return { Authorization: `Bearer ${token}` }
  }

  async ensureFolder(name: string, parentId?: string): Promise<CloudFolderResult> {
    const headers = this.getAuthHeader()
    const basePath = parentId
      ? `https://graph.microsoft.com/v1.0/me/drive/items/${parentId}/children`
      : `https://graph.microsoft.com/v1.0/me/drive/root/children`

    const res = await fetch(basePath, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'replace',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Erro ao criar pasta no OneDrive: ${err}`)
    }

    const data = (await res.json()) as { id: string; name: string }
    return { id: data.id, name: data.name }
  }

  async uploadFile(options: UploadFileOptions): Promise<CloudFileResult> {
    const headers = this.getAuthHeader()
    const endpoint = options.parentFolderId
      ? `https://graph.microsoft.com/v1.0/me/drive/items/${options.parentFolderId}:/${encodeURIComponent(
          options.name
        )}:/content`
      : `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(options.name)}:/content`

    let body: any = options.content
    if (body instanceof Blob) {
      body = await body.arrayBuffer()
    }

    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': options.mimeType,
      },
      body,
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Erro ao enviar arquivo para o OneDrive: ${err}`)
    }

    const data = (await res.json()) as { id: string; name: string; webUrl?: string }
    return { id: data.id, name: data.name, webViewLink: data.webUrl }
  }

  async getFile(fileId: string): Promise<Blob> {
    const headers = this.getAuthHeader()
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`, {
      headers,
    })
    if (!res.ok) throw new Error(`Erro ao obter arquivo do OneDrive: ${fileId}`)
    return await res.blob()
  }

  async listFolder(folderId: string): Promise<Array<{ id: string; name: string; mimeType: string }>> {
    const headers = this.getAuthHeader()
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`, {
      headers,
    })
    if (!res.ok) throw new Error(`Erro ao listar pasta no OneDrive: ${folderId}`)
    const data = (await res.json()) as { value?: Array<{ id: string; name: string; file?: any }> }
    return (data.value || []).map((item) => ({
      id: item.id,
      name: item.name,
      mimeType: item.file?.mimeType || 'application/octet-stream',
    }))
  }

  async uploadBookPackage(options: UploadBookPackageOptions): Promise<UploadBookPackageResult> {
    const rootFolder = await this.ensureFolder('Aresta')
    const bookFolder = await this.ensureFolder(options.bookTitle, rootFolder.id)

    const bookFile = await this.uploadFile({
      name: options.bookFileName,
      content: options.bookFile,
      mimeType: options.bookMimeType,
      parentFolderId: bookFolder.id,
    })

    let coverFile: CloudFileResult | undefined
    if (options.coverBlob) {
      coverFile = await this.uploadFile({
        name: options.coverFileName || 'cover.webp',
        content: options.coverBlob,
        mimeType: options.coverBlob.type || 'image/webp',
        parentFolderId: bookFolder.id,
      })
    }

    return {
      rootFolderId: rootFolder.id,
      bookFolderId: bookFolder.id,
      bookFile,
      coverFile,
    }
  }

  private async findFolder(name: string, parentId?: string): Promise<CloudFolderResult | null> {
    const headers = this.getAuthHeader()
    const endpoint = parentId
      ? `https://graph.microsoft.com/v1.0/me/drive/items/${parentId}/children?$select=id,name,folder`
      : 'https://graph.microsoft.com/v1.0/me/drive/root/children?$select=id,name,folder'
    const res = await fetch(endpoint, { headers })
    if (!res.ok) throw new Error(`Erro ao listar pastas do OneDrive (${res.status})`)
    const data = await res.json() as { value?: Array<{ id: string; name: string; folder?: unknown }> }
    const item = data.value?.find((candidate) => candidate.name === name && candidate.folder)
    return item ? { id: item.id, name: item.name } : null
  }

  private async ensureUniqueFolder(name: string, parentId?: string): Promise<CloudFolderResult> {
    return (await this.findFolder(name, parentId)) || this.ensureFolder(name, parentId)
  }

  async ensureDataFolders(): Promise<void> {
    const root = await this.ensureUniqueFolder('Aresta')
    const version = await this.ensureUniqueFolder('v1', root.id)
    const data = await this.ensureUniqueFolder('data', version.id)
    this.dataFolderId = data.id
    await Promise.all((['canvas', 'notes', 'drawing_notes'] as DataSubFolder[]).map(async (folder) => {
      this.subFolderIds[folder] = (await this.ensureUniqueFolder(folder, data.id)).id
    }))
  }

  private async getDataFolderId(): Promise<string> {
    if (!this.dataFolderId) await this.ensureDataFolders()
    return this.dataFolderId!
  }

  private async getSubFolderId(subFolder: DataSubFolder): Promise<string> {
    if (!this.subFolderIds[subFolder]) await this.ensureDataFolders()
    return this.subFolderIds[subFolder]!
  }

  private async findFile(name: string, parentId: string): Promise<{ id: string; name: string } | null> {
    const entries = await this.listFolder(parentId)
    const entry = entries.find((item) => item.name === name)
    return entry ? { id: entry.id, name: entry.name } : null
  }

  private async putJson(parentFolderId: string, fileName: string, data: unknown): Promise<DataSyncResult> {
    await this.uploadFile({ name: fileName, content: new Blob([JSON.stringify(data)], { type: 'application/json' }), mimeType: 'application/json', parentFolderId })
    return { fileName, itemCount: Array.isArray(data) ? data.length : 1, syncedAt: new Date().toISOString() }
  }

  async uploadDataFile(fileName: string, data: unknown): Promise<DataSyncResult> {
    return this.putJson(await this.getDataFolderId(), fileName, data)
  }

  async uploadSubFolderDataFile(subFolder: DataSubFolder, fileName: string, data: unknown): Promise<DataSyncResult> {
    return this.putJson(await this.getSubFolderId(subFolder), fileName, data)
  }

  private async downloadJson<T>(parentFolderId: string, fileName: string): Promise<T | null> {
    const file = await this.findFile(fileName, parentFolderId)
    if (!file) return null
    const text = await (await this.getFile(file.id)).text()
    return JSON.parse(text) as T
  }

  async downloadDataFile<T>(fileName: string): Promise<T | null> { return this.downloadJson<T>(await this.getDataFolderId(), fileName) }
  async downloadSubFolderDataFile<T>(subFolder: DataSubFolder, fileName: string): Promise<T | null> { return this.downloadJson<T>(await this.getSubFolderId(subFolder), fileName) }
  async listSubFolderFiles(subFolder: DataSubFolder): Promise<string[]> { return (await this.listFolder(await this.getSubFolderId(subFolder))).filter((item) => item.mimeType === 'application/json').map((item) => item.name) }

  private async deleteJson(parentFolderId: string, fileName: string): Promise<void> {
    const file = await this.findFile(fileName, parentFolderId)
    if (!file) return
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${file.id}`, { method: 'DELETE', headers: this.getAuthHeader() })
    if (!res.ok && res.status !== 404) throw new Error(`Erro ao remover ${fileName} do OneDrive`)
  }
  async deleteDataFile(fileName: string): Promise<void> { return this.deleteJson(await this.getDataFolderId(), fileName) }
  async deleteSubFolderDataFile(subFolder: DataSubFolder, fileName: string): Promise<void> { return this.deleteJson(await this.getSubFolderId(subFolder), fileName) }
}
