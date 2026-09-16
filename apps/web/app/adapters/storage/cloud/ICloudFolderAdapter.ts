import type { CloudFileResult, CloudFolderResult, UploadBookPackageOptions, UploadBookPackageResult, UploadFileOptions } from './ICloudStorageProvider'
import type { DataSubFolder, DataSyncResult, IDataSyncProvider } from './IDataSyncProvider'

/**
 * Ponte para uma pasta iCloud Drive escolhida no desktop. A seleção da pasta e
 * as permissões precisam ser fornecidas pelo shell Tauri; a web nunca recebe
 * acesso implícito ao sistema de arquivos.
 */
export class ICloudFolderAdapter implements IDataSyncProvider {
  readonly providerName = 'icloud-folder' as const
  private unavailable(): never { throw new Error('A pasta iCloud Drive só está disponível no aplicativo Tauri após o usuário selecionar uma pasta.') }
  async ensureFolder(_name: string, _parentId?: string): Promise<CloudFolderResult> { return this.unavailable() }
  async uploadFile(_options: UploadFileOptions): Promise<CloudFileResult> { return this.unavailable() }
  async getFile(_fileId: string): Promise<Blob> { return this.unavailable() }
  async listFolder(_folderId: string): Promise<Array<{ id: string; name: string; mimeType: string }>> { return this.unavailable() }
  async uploadBookPackage(_options: UploadBookPackageOptions): Promise<UploadBookPackageResult> { return this.unavailable() }
  async ensureDataFolders(): Promise<void> { return this.unavailable() }
  async uploadDataFile(_fileName: string, _data: unknown): Promise<DataSyncResult> { return this.unavailable() }
  async uploadSubFolderDataFile(_subFolder: DataSubFolder, _fileName: string, _data: unknown): Promise<DataSyncResult> { return this.unavailable() }
  async downloadDataFile<T>(_fileName: string): Promise<T | null> { return this.unavailable() }
  async downloadSubFolderDataFile<T>(_subFolder: DataSubFolder, _fileName: string): Promise<T | null> { return this.unavailable() }
  async listSubFolderFiles(_subFolder: DataSubFolder): Promise<string[]> { return this.unavailable() }
  async deleteDataFile(_fileName: string): Promise<void> { return this.unavailable() }
  async deleteSubFolderDataFile(_subFolder: DataSubFolder, _fileName: string): Promise<void> { return this.unavailable() }
}
