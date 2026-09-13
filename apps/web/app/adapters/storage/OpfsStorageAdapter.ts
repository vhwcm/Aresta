import type { IBinaryStorageAdapter } from './IBinaryStorageAdapter';
import { getCachedBook, saveCachedBook, deleteCachedBook } from '~/utils/bookCache';

export class OpfsStorageAdapter implements IBinaryStorageAdapter {
  private opfsRoot: FileSystemDirectoryHandle | null = null;
  private hasOpfs = false;
  private memoryFallback = new Map<string, ArrayBuffer>();

  async init(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage) {
      try {
        this.opfsRoot = await navigator.storage.getDirectory();
        this.hasOpfs = true;
      } catch (e) {
        this.hasOpfs = false;
      }
    }
  }

  async saveFile(key: string, data: ArrayBuffer | Uint8Array, mimeType = 'application/epub+zip'): Promise<string> {
    await this.init();
    const arrayBuffer = data instanceof ArrayBuffer ? data : (data.buffer as ArrayBuffer);

    if (this.hasOpfs && this.opfsRoot) {
      try {
        const fileHandle = await this.opfsRoot.getFileHandle(key, { create: true });
        const accessHandle = await (fileHandle as any).createWritable();
        await accessHandle.write(arrayBuffer);
        await accessHandle.close();
        return `opfs://${key}`;
      } catch (e) {
        console.warn('[OpfsStorageAdapter] Fallback para IndexedDB:', e);
      }
    }

    const fileType = mimeType.includes('pdf')
      ? 'pdf'
      : (mimeType.includes('json') || mimeType.includes('didactic') ? 'didactic' : 'epub');
    const savedInCache = await saveCachedBook(key, arrayBuffer, key, fileType);
    if (!savedInCache) {
      this.memoryFallback.set(key, arrayBuffer);
      return `memory://${key}`;
    }
    return `indexeddb://${key}`;
  }

  async getFile(key: string): Promise<ArrayBuffer | null> {
    await this.init();

    if (this.hasOpfs && this.opfsRoot) {
      try {
        const fileHandle = await this.opfsRoot.getFileHandle(key);
        const file = await fileHandle.getFile();
        return await file.arrayBuffer();
      } catch (e) {
        // Fallback to IndexedDB
      }
    }

    const cached = await getCachedBook(key);
    if (cached?.arrayBuffer) {
      return cached.arrayBuffer;
    }

    return this.memoryFallback.get(key) || null;
  }

  async deleteFile(key: string): Promise<boolean> {
    await this.init();

    if (this.hasOpfs && this.opfsRoot) {
      try {
        await this.opfsRoot.removeEntry(key);
        return true;
      } catch {
        // Arquivo pode não existir no OPFS
      }
    }

    const deletedFromCache = await deleteCachedBook(key);
    const deletedFromMemory = this.memoryFallback.delete(key);
    return deletedFromCache || deletedFromMemory;
  }

  async exists(key: string): Promise<boolean> {
    const file = await this.getFile(key);
    return file !== null;
  }
}
