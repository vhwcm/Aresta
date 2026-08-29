import { writeFile, readFile, remove, exists as fsExists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import type { IBinaryStorageAdapter } from './IBinaryStorageAdapter';

export class TauriFsStorageAdapter implements IBinaryStorageAdapter {
  private baseDir = 'books';
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await mkdir(this.baseDir, { baseDir: BaseDirectory.AppData, recursive: true });
      this.isInitialized = true;
    } catch (e) {
      console.warn('[TauriFsStorageAdapter] Diretório de livros já existe ou erro ao criar:', e);
      this.isInitialized = true;
    }
  }

  async saveFile(key: string, data: ArrayBuffer | Uint8Array): Promise<string> {
    await this.init();
    const filePath = `${this.baseDir}/${key}`;
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    await writeFile(filePath, bytes, { baseDir: BaseDirectory.AppData });
    return filePath;
  }

  async getFile(key: string): Promise<ArrayBuffer | null> {
    await this.init();
    const filePath = `${this.baseDir}/${key}`;
    try {
      const bytes = await readFile(filePath, { baseDir: BaseDirectory.AppData });
      return bytes.buffer as ArrayBuffer;
    } catch (e) {
      return null;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    await this.init();
    const filePath = `${this.baseDir}/${key}`;
    try {
      await remove(filePath, { baseDir: BaseDirectory.AppData });
      return true;
    } catch (e) {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    await this.init();
    const filePath = `${this.baseDir}/${key}`;
    try {
      return await fsExists(filePath, { baseDir: BaseDirectory.AppData });
    } catch (e) {
      return false;
    }
  }
}
