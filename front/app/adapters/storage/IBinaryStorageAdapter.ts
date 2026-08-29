export interface IBinaryStorageAdapter {
  init(): Promise<void>;
  saveFile(key: string, data: ArrayBuffer | Uint8Array, mimeType?: string): Promise<string>;
  getFile(key: string): Promise<ArrayBuffer | null>;
  deleteFile(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
}
