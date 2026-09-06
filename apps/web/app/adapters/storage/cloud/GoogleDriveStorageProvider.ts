import type {
  ICloudStorageProvider,
  CloudFolderResult,
  CloudFileResult,
  UploadFileOptions,
  UploadBookPackageOptions,
  UploadBookPackageResult,
} from './ICloudStorageProvider'

export class GoogleDriveStorageProvider implements ICloudStorageProvider {
  readonly providerName = 'google' as const
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
      throw new Error('Usuário não autenticado no Google Drive. Faça login com o Google.')
    }
    return { Authorization: `Bearer ${token}` }
  }

  async ensureFolder(name: string, parentId?: string): Promise<CloudFolderResult> {
    const headers = this.getAuthHeader()
    const safeName = name.replace(/'/g, "\\'")

    let query = `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    if (parentId) {
      query += ` and '${parentId}' in parents`
    }

    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name)`

    const searchRes = await fetch(searchUrl, { headers })
    if (!searchRes.ok) {
      const errText = await searchRes.text()
      throw new Error(`Erro ao buscar pasta no Google Drive (${searchRes.status}): ${errText}`)
    }

    const searchData = (await searchRes.json()) as { files?: Array<{ id: string; name: string }> }
    if (searchData.files && searchData.files.length > 0 && searchData.files[0]) {
      return { id: searchData.files[0].id, name: searchData.files[0].name }
    }

    // Cria a pasta caso não exista
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentId ? { parents: [parentId] } : {}),
      }),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      throw new Error(`Erro ao criar pasta "${name}" no Google Drive: ${errText}`)
    }

    const newFolder = (await createRes.json()) as { id: string; name: string }
    return { id: newFolder.id, name: newFolder.name }
  }

  async uploadFile(options: UploadFileOptions): Promise<CloudFileResult> {
    const headers = this.getAuthHeader()
    const boundary = '-------aresta_drive_boundary_' + Date.now()

    const metadata: Record<string, any> = {
      name: options.name,
      mimeType: options.mimeType,
      ...(options.parentFolderId ? { parents: [options.parentFolderId] } : {}),
    }

    let fileBlob: Blob
    if (options.content instanceof Blob) {
      fileBlob = options.content
    } else {
      fileBlob = new Blob([options.content], { type: options.mimeType })
    }

    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
      metadata
    )}`
    const mediaHeaderPart = `${delimiter}Content-Type: ${options.mimeType}\r\n\r\n`

    const multipartBlob = new Blob([metadataPart, mediaHeaderPart, fileBlob, closeDelimiter], {
      type: `multipart/related; boundary=${boundary}`,
    })

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBlob,
      }
    )

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      throw new Error(`Erro no upload do arquivo "${options.name}" para o Drive: ${errText}`)
    }

    const uploaded = (await uploadRes.json()) as { id: string; name: string; webViewLink?: string }
    return {
      id: uploaded.id,
      name: uploaded.name,
      webViewLink: uploaded.webViewLink,
    }
  }

  async getFile(fileId: string): Promise<Blob> {
    const headers = this.getAuthHeader()
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers,
    })
    if (!res.ok) {
      throw new Error(`Erro ao baixar arquivo ${fileId} do Google Drive`)
    }
    return await res.blob()
  }

  async listFolder(folderId: string): Promise<Array<{ id: string; name: string; mimeType: string }>> {
    const headers = this.getAuthHeader()
    const query = `'${folderId}' in parents and trashed = false`
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name,mimeType)`

    const res = await fetch(url, { headers })
    if (!res.ok) {
      throw new Error(`Erro ao listar conteúdo da pasta ${folderId}`)
    }

    const data = (await res.json()) as { files?: Array<{ id: string; name: string; mimeType: string }> }
    return data.files || []
  }

  async uploadBookPackage(options: UploadBookPackageOptions): Promise<UploadBookPackageResult> {
    // 1. Garante a pasta raiz "Aresta" no Google Drive
    const rootFolder = await this.ensureFolder('Aresta')

    // 2. Garante a subpasta do livro: "Aresta/[Título do Livro]/"
    const safeTitle = (options.bookTitle || 'Livro sem título').trim()
    const bookFolder = await this.ensureFolder(safeTitle, rootFolder.id)

    // 3. Upload do arquivo binário do livro (.epub ou .pdf)
    const bookFile = await this.uploadFile({
      name: options.bookFileName,
      content: options.bookFile,
      mimeType: options.bookMimeType,
      parentFolderId: bookFolder.id,
    })

    // 4. Upload da capa se fornecida
    let coverFile: CloudFileResult | undefined
    if (options.coverBlob) {
      const coverName = options.coverFileName || 'cover.webp'
      coverFile = await this.uploadFile({
        name: coverName,
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
