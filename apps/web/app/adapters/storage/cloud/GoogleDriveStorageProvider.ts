import type {
  CloudFolderResult,
  CloudFileResult,
  UploadFileOptions,
  UploadBookPackageOptions,
  UploadBookPackageResult,
} from './ICloudStorageProvider'
import type { IDataSyncProvider, DataSubFolder, DataSyncResult } from './IDataSyncProvider'

export class GoogleDriveStorageProvider implements IDataSyncProvider {
  readonly providerName = 'google' as const
  private getAccessToken: () => string | null

  // Cache de IDs de pastas para evitar buscas repetidas na API
  private _folderIdCache: Map<string, string> = new Map()
  private _dataFolderId: string | null = null
  private _subFolderIds: Partial<Record<DataSubFolder, string>> = {}

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
    } else {
      query += ` and 'root' in parents`
    }

    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name)&orderBy=createdTime asc`

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
        parents: [parentId || 'root'],
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

    const boundary = '-------aresta_drive_boundary_' + Date.now()
    const delimiter = `--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
      metadata
    )}\r\n`
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

  async listBooks(): Promise<Array<{ title: string; folderId: string }>> {
    try {
      const rootFolder = await this.ensureFolder('Aresta')
      const items = await this.listFolder(rootFolder.id)
      const SYSTEM_FOLDERS = new Set(['data', 'v1', 'v2', 'v3', '.aresta', 'books'])
      return items
        .filter((item) => {
          if (item.mimeType !== 'application/vnd.google-apps.folder') return false
          const name = (item.name || '').trim().toLowerCase()
          if (SYSTEM_FOLDERS.has(name) || /^v\d+$/i.test(name) || name.startsWith('.')) {
            return false
          }
          return true
        })
        .map((folder) => ({ title: folder.name, folderId: folder.id }))
    } catch {
      return []
    }
  }

  async deleteBookFolder(bookTitle: string, folderId?: string): Promise<void> {
    const headers = this.getAuthHeader()
    if (folderId) {
      try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}`, {
          method: 'DELETE',
          headers,
        })
        if (res.ok || res.status === 404) {
          this._folderIdCache.clear()
          return
        }
      } catch (err) {
        console.warn(`[GoogleDriveStorageProvider] Falha ao excluir pasta por folderId (${folderId}):`, err)
      }
    }

    if (!bookTitle) return

    try {
      const rootFolder = await this.ensureFolder('Aresta')
      const safeTitle = bookTitle.trim().replace(/'/g, "\\'")
      const query = `'${rootFolder.id}' in parents and name = '${safeTitle}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`
      const res = await fetch(url, { headers })
      if (res.ok) {
        const data = (await res.json()) as { files?: Array<{ id: string; name: string }> }
        if (data.files && data.files.length > 0) {
          for (const folder of data.files) {
            try {
              await fetch(`https://www.googleapis.com/drive/v3/files/${folder.id}`, {
                method: 'DELETE',
                headers,
              })
            } catch (delErr) {
              console.warn(`[GoogleDriveStorageProvider] Falha ao excluir pasta do livro ${folder.id}:`, delErr)
            }
          }
        }
      }
      this._folderIdCache.clear()
    } catch (err) {
      console.warn(`[GoogleDriveStorageProvider] Erro ao excluir pasta do livro "${bookTitle}":`, err)
    }
  }

  /**
   * Exclui permanentemente todas as pastas e arquivos do Aresta no Google Drive (incluindo livros e dados).
   */
  async deleteAllArestaData(): Promise<void> {
    try {
      const headers = this.getAuthHeader()
      const query = `name = 'Aresta' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&fields=files(id,name)`

      const res = await fetch(url, { headers })
      if (!res.ok) return

      const data = (await res.json()) as { files?: Array<{ id: string; name: string }> }
      if (data.files && data.files.length > 0) {
        for (const folder of data.files) {
          try {
            await fetch(`https://www.googleapis.com/drive/v3/files/${folder.id}`, {
              method: 'DELETE',
              headers,
            })
          } catch (delErr) {
            console.warn(`[GoogleDriveStorageProvider] Falha ao deletar pasta ${folder.id}:`, delErr)
          }
        }
      }
      this._folderIdCache.clear()
      this._dataFolderId = null
      this._subFolderIds = {}
    } catch (err) {
      console.warn('[GoogleDriveStorageProvider] Erro ao excluir dados no Google Drive:', err)
    }
  }

  // =========================================================================
  // IDataSyncProvider — Operações de dados estruturados (JSON)
  // =========================================================================

  /** Garante pastas Aresta/data/ e todas as subpastas necessárias */
  async ensureDataFolders(): Promise<void> {
    const rootFolder = await this.ensureFolder('Aresta')
    const versionFolder = await this.ensureFolder('v1', rootFolder.id)
    const dataFolder = await this.ensureFolder('data', versionFolder.id)
    this._dataFolderId = dataFolder.id

    const subFolders: DataSubFolder[] = ['canvas', 'notes', 'drawing_notes']
    await Promise.all(
      subFolders.map(async (name) => {
        const sf = await this.ensureFolder(name, dataFolder.id)
        this._subFolderIds[name] = sf.id
      })
    )
  }

  /** Garante que as pastas de dados existem e retorna o ID da pasta data/ */
  private async getDataFolderId(): Promise<string> {
    if (this._dataFolderId) return this._dataFolderId
    await this.ensureDataFolders()
    return this._dataFolderId!
  }

  /** Retorna o ID de uma subpasta, criando se necessário */
  private async getSubFolderId(subFolder: DataSubFolder): Promise<string> {
    if (this._subFolderIds[subFolder]) return this._subFolderIds[subFolder]!
    await this.ensureDataFolders()
    return this._subFolderIds[subFolder]!
  }

  /** Encontra o ID de um arquivo pelo nome dentro de uma pasta */
  private async findFileId(name: string, parentId: string): Promise<string | null> {
    const headers = this.getAuthHeader()
    const safeName = name.replace(/'/g, "\\'").replace(/"/g, '\\"')
    const query = `name = '${safeName}' and '${parentId}' in parents and trashed = false`
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&orderBy=createdTime asc`
    const res = await fetch(url, { headers })
    if (!res.ok) return null
    const data = (await res.json()) as { files?: Array<{ id: string }> }
    return data.files?.[0]?.id ?? null
  }

  /** Deleta um arquivo pelo ID */
  private async deleteFileById(fileId: string): Promise<void> {
    const headers = this.getAuthHeader()
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers,
    })
  }

  async uploadDataFile(fileName: string, data: unknown): Promise<DataSyncResult> {
    const parentId = await this.getDataFolderId()
    const json = JSON.stringify(data)
    const blob = new Blob([json], { type: 'application/json' })

    // Verifica se o arquivo já existe para fazer update em vez de criar duplicata
    const existingId = await this.findFileId(fileName, parentId)
    if (existingId) {
      const headers = this.getAuthHeader()
      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: blob,
        }
      )
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Erro ao atualizar ${fileName} no Drive: ${errText}`)
      }
    } else {
      await this.uploadFile({
        name: fileName,
        content: blob,
        mimeType: 'application/json',
        parentFolderId: parentId,
      })
    }

    const payload = Array.isArray(data) ? data : [data]
    return { fileName, itemCount: payload.length, syncedAt: new Date().toISOString() }
  }

  async uploadSubFolderDataFile(
    subFolder: DataSubFolder,
    fileName: string,
    data: unknown
  ): Promise<DataSyncResult> {
    const parentId = await this.getSubFolderId(subFolder)
    const json = JSON.stringify(data)
    const blob = new Blob([json], { type: 'application/json' })

    const existingId = await this.findFileId(fileName, parentId)
    if (existingId) {
      const headers = this.getAuthHeader()
      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: blob,
        }
      )
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Erro ao atualizar ${subFolder}/${fileName} no Drive: ${errText}`)
      }
    } else {
      await this.uploadFile({
        name: fileName,
        content: blob,
        mimeType: 'application/json',
        parentFolderId: parentId,
      })
    }

    return { fileName, itemCount: 1, syncedAt: new Date().toISOString() }
  }

  async downloadDataFile<T>(fileName: string): Promise<T | null> {
    try {
      const parentId = await this.getDataFolderId()
      const fileId = await this.findFileId(fileName, parentId)
      if (!fileId) return null
      const blob = await this.getFile(fileId)
      const text = await blob.text()
      return JSON.parse(text) as T
    } catch {
      return null
    }
  }

  async downloadSubFolderDataFile<T>(
    subFolder: DataSubFolder,
    fileName: string
  ): Promise<T | null> {
    try {
      const parentId = await this.getSubFolderId(subFolder)
      const fileId = await this.findFileId(fileName, parentId)
      if (!fileId) return null
      const blob = await this.getFile(fileId)
      const text = await blob.text()
      return JSON.parse(text) as T
    } catch {
      return null
    }
  }

  async listSubFolderFiles(subFolder: DataSubFolder): Promise<string[]> {
    try {
      const parentId = await this.getSubFolderId(subFolder)
      const items = await this.listFolder(parentId)
      return items
        .filter((item) => item.mimeType === 'application/json')
        .map((item) => item.name)
    } catch {
      return []
    }
  }

  async deleteDataFile(fileName: string): Promise<void> {
    try {
      const parentId = await this.getDataFolderId()
      const fileId = await this.findFileId(fileName, parentId)
      if (fileId) await this.deleteFileById(fileId)
    } catch {
      // Falha silenciosa — arquivo pode já não existir
    }
  }

  async deleteSubFolderDataFile(subFolder: DataSubFolder, fileName: string): Promise<void> {
    try {
      const parentId = await this.getSubFolderId(subFolder)
      const fileId = await this.findFileId(fileName, parentId)
      if (fileId) await this.deleteFileById(fileId)
    } catch {
      // Falha silenciosa
    }
  }
}
