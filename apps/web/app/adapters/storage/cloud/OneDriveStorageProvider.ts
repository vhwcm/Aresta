import type {
  ICloudStorageProvider,
  CloudFolderResult,
  CloudFileResult,
  UploadFileOptions,
  UploadBookPackageOptions,
  UploadBookPackageResult,
} from './ICloudStorageProvider'

export class OneDriveStorageProvider implements ICloudStorageProvider {
  readonly providerName = 'onedrive' as const
  private getAccessToken: () => string | null

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
}
