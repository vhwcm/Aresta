export interface CloudFolderResult {
  id: string
  name: string
}

export interface CloudFileResult {
  id: string
  name: string
  webViewLink?: string
}

export interface UploadFileOptions {
  name: string
  content: Blob | ArrayBuffer
  mimeType: string
  parentFolderId?: string
}

export interface UploadBookPackageOptions {
  bookTitle: string
  bookFile: Blob | ArrayBuffer
  bookFileName: string
  bookMimeType: string
  coverBlob?: Blob | null
  coverFileName?: string
}

export interface UploadBookPackageResult {
  rootFolderId: string
  bookFolderId: string
  bookFile: CloudFileResult
  coverFile?: CloudFileResult
}

export interface DownloadBookPackageOptions {
  folderId?: string
  bookTitle?: string
}

export interface DownloadBookPackageResult {
  blob: Blob
  fileName: string
  mimeType: string
  coverBlob?: Blob
  coverFileName?: string
}

export interface ICloudStorageProvider {
  readonly providerName: string
  ensureFolder(name: string, parentId?: string): Promise<CloudFolderResult>
  uploadFile(options: UploadFileOptions): Promise<CloudFileResult>
  getFile(fileId: string): Promise<Blob>
  listFolder(folderId: string): Promise<Array<{ id: string; name: string; mimeType: string }>>
  uploadBookPackage(options: UploadBookPackageOptions): Promise<UploadBookPackageResult>
  downloadBookFile?(options: DownloadBookPackageOptions): Promise<DownloadBookPackageResult | null>
  deleteBookFolder?(bookTitle: string, folderId?: string): Promise<void>
  deleteAllArestaData?(): Promise<void>
}
