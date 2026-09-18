import type { CloudFileResult, CloudFolderResult, UploadBookPackageOptions, UploadBookPackageResult, UploadFileOptions } from './ICloudStorageProvider'
import type { DataSubFolder, DataSyncResult, IDataSyncProvider } from './IDataSyncProvider'
import { writeFile, readFile, remove, exists, mkdir, readDir, BaseDirectory } from '@tauri-apps/plugin-fs'

/**
 * Adaptador para iCloud Drive / Pasta Sincronizada local no Tauri Desktop.
 * Utiliza o sistema de arquivos local montado (BaseDirectory.AppData ou diretório monitorado pelo iCloud).
 */
export class ICloudFolderAdapter implements IDataSyncProvider {
  readonly providerName = 'icloud-folder' as const
  private rootDir = 'iCloud_Aresta'
  private isInitialized = false

  private isTauriEnv(): boolean {
    return typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)
  }

  async ensureFolder(name: string, parentId?: string): Promise<CloudFolderResult> {
    await this.ensureDataFolders()
    const folderPath = parentId ? `${parentId}/${name}` : `${this.rootDir}/${name}`
    if (this.isTauriEnv()) {
      try {
        await mkdir(folderPath, { baseDir: BaseDirectory.AppData, recursive: true })
      } catch {}
    }
    return { id: folderPath, name }
  }

  async uploadFile(options: UploadFileOptions): Promise<CloudFileResult> {
    await this.ensureDataFolders()
    const filePath = options.parentFolderId ? `${options.parentFolderId}/${options.name}` : `${this.rootDir}/books/${options.name}`
    const buffer = options.content instanceof ArrayBuffer ? new Uint8Array(options.content) : new Uint8Array(await (options.content as Blob).arrayBuffer())
    
    if (this.isTauriEnv()) {
      try {
        await writeFile(filePath, buffer, { baseDir: BaseDirectory.AppData })
      } catch (e) {
        console.warn('[ICloudFolderAdapter] Erro ao gravar arquivo via plugin-fs:', e)
      }
    }
    return {
      id: filePath,
      name: options.name,
      webViewLink: filePath,
    }
  }

  async getFile(fileId: string): Promise<Blob> {
    if (this.isTauriEnv()) {
      try {
        const bytes = await readFile(fileId, { baseDir: BaseDirectory.AppData })
        return new Blob([bytes])
      } catch (e) {
        console.warn('[ICloudFolderAdapter] Erro ao ler arquivo do iCloud local:', e)
      }
    }
    return new Blob([])
  }

  async listFolder(folderId: string): Promise<Array<{ id: string; name: string; mimeType: string }>> {
    if (this.isTauriEnv()) {
      try {
        const entries = await readDir(folderId, { baseDir: BaseDirectory.AppData })
        return entries.map((entry) => ({
          id: `${folderId}/${entry.name}`,
          name: entry.name,
          mimeType: entry.isDirectory ? 'application/vnd.google-apps.folder' : 'application/octet-stream',
        }))
      } catch {
        return []
      }
    }
    return []
  }

  async uploadBookPackage(options: UploadBookPackageOptions): Promise<UploadBookPackageResult> {
    const bookFolder = `${this.rootDir}/books/${options.bookTitle.replace(/[^a-z0-9_ -]/gi, '_')}`
    await this.ensureFolder(options.bookTitle, `${this.rootDir}/books`)
    const bookFile = await this.uploadFile({
      name: options.bookFileName,
      content: options.bookFile,
      mimeType: options.bookMimeType,
      parentFolderId: bookFolder,
    })
    let coverFile: CloudFileResult | undefined
    if (options.coverBlob) {
      coverFile = await this.uploadFile({
        name: options.coverFileName || 'cover.webp',
        content: options.coverBlob,
        mimeType: 'image/webp',
        parentFolderId: bookFolder,
      })
    }
    return {
      rootFolderId: this.rootDir,
      bookFolderId: bookFolder,
      bookFile,
      coverFile,
    }
  }

  async deleteBookFolder(bookTitle: string): Promise<void> {
    if (!bookTitle) return
    if (this.isTauriEnv()) {
      try {
        const bookFolder = `${this.rootDir}/books/${bookTitle.replace(/[^a-z0-9_ -]/gi, '_')}`
        await remove(bookFolder, { baseDir: BaseDirectory.AppData, recursive: true }).catch(() => {})
      } catch (err) {
        console.warn('[ICloudFolderAdapter] Falha ao excluir pasta local do livro:', err)
      }
    }
  }

  async ensureDataFolders(): Promise<void> {
    if (this.isInitialized) return
    if (this.isTauriEnv()) {
      try {
        await mkdir(this.rootDir, { baseDir: BaseDirectory.AppData, recursive: true })
        await mkdir(`${this.rootDir}/data`, { baseDir: BaseDirectory.AppData, recursive: true })
        await mkdir(`${this.rootDir}/data/canvas`, { baseDir: BaseDirectory.AppData, recursive: true })
        await mkdir(`${this.rootDir}/data/notes`, { baseDir: BaseDirectory.AppData, recursive: true })
        await mkdir(`${this.rootDir}/data/drawing_notes`, { baseDir: BaseDirectory.AppData, recursive: true })
        await mkdir(`${this.rootDir}/books`, { baseDir: BaseDirectory.AppData, recursive: true })
      } catch (e) {
        console.warn('[ICloudFolderAdapter] Erro ao garantir pastas iCloud:', e)
      }
    }
    this.isInitialized = true
  }

  async uploadDataFile(fileName: string, data: unknown): Promise<DataSyncResult> {
    await this.ensureDataFolders()
    const filePath = `${this.rootDir}/data/${fileName}`
    const jsonStr = JSON.stringify(data, null, 2)
    const encoder = new TextEncoder()
    const buffer = encoder.encode(jsonStr)

    if (this.isTauriEnv()) {
      try {
        await writeFile(filePath, buffer, { baseDir: BaseDirectory.AppData })
      } catch (e) {
        console.warn('[ICloudFolderAdapter] Erro ao gravar arquivo de dados no iCloud:', e)
      }
    }

    const itemCount = Array.isArray(data) ? data.length : (data && typeof data === 'object' ? Object.keys(data).length : 1)
    return {
      fileName,
      itemCount,
      syncedAt: new Date().toISOString(),
    }
  }

  async uploadSubFolderDataFile(subFolder: DataSubFolder, fileName: string, data: unknown): Promise<DataSyncResult> {
    await this.ensureDataFolders()
    const filePath = `${this.rootDir}/data/${subFolder}/${fileName}`
    const jsonStr = JSON.stringify(data, null, 2)
    const encoder = new TextEncoder()
    const buffer = encoder.encode(jsonStr)

    if (this.isTauriEnv()) {
      try {
        await writeFile(filePath, buffer, { baseDir: BaseDirectory.AppData })
      } catch (e) {
        console.warn('[ICloudFolderAdapter] Erro ao gravar subpasta de dados no iCloud:', e)
      }
    }

    return {
      fileName,
      itemCount: 1,
      syncedAt: new Date().toISOString(),
    }
  }

  async downloadDataFile<T>(fileName: string): Promise<T | null> {
    await this.ensureDataFolders()
    const filePath = `${this.rootDir}/data/${fileName}`
    if (this.isTauriEnv()) {
      try {
        const fileExists = await exists(filePath, { baseDir: BaseDirectory.AppData })
        if (!fileExists) return null
        const bytes = await readFile(filePath, { baseDir: BaseDirectory.AppData })
        const decoder = new TextDecoder()
        const text = decoder.decode(bytes)
        return JSON.parse(text) as T
      } catch {
        return null
      }
    }
    return null
  }

  async downloadSubFolderDataFile<T>(subFolder: DataSubFolder, fileName: string): Promise<T | null> {
    await this.ensureDataFolders()
    const filePath = `${this.rootDir}/data/${subFolder}/${fileName}`
    if (this.isTauriEnv()) {
      try {
        const fileExists = await exists(filePath, { baseDir: BaseDirectory.AppData })
        if (!fileExists) return null
        const bytes = await readFile(filePath, { baseDir: BaseDirectory.AppData })
        const decoder = new TextDecoder()
        const text = decoder.decode(bytes)
        return JSON.parse(text) as T
      } catch {
        return null
      }
    }
    return null
  }

  async listSubFolderFiles(subFolder: DataSubFolder): Promise<string[]> {
    await this.ensureDataFolders()
    const folderPath = `${this.rootDir}/data/${subFolder}`
    if (this.isTauriEnv()) {
      try {
        const entries = await readDir(folderPath, { baseDir: BaseDirectory.AppData })
        return entries.filter((e) => !e.isDirectory && e.name.endsWith('.json')).map((e) => e.name)
      } catch {
        return []
      }
    }
    return []
  }

  async deleteDataFile(fileName: string): Promise<void> {
    await this.ensureDataFolders()
    const filePath = `${this.rootDir}/data/${fileName}`
    if (this.isTauriEnv()) {
      try {
        await remove(filePath, { baseDir: BaseDirectory.AppData })
      } catch {}
    }
  }

  async deleteSubFolderDataFile(subFolder: DataSubFolder, fileName: string): Promise<void> {
    await this.ensureDataFolders()
    const filePath = `${this.rootDir}/data/${subFolder}/${fileName}`
    if (this.isTauriEnv()) {
      try {
        await remove(filePath, { baseDir: BaseDirectory.AppData })
      } catch {}
    }
  }
}
