import type { IBinaryStorageAdapter } from './IBinaryStorageAdapter';
import { TauriFsStorageAdapter } from './TauriFsStorageAdapter';
import { OpfsStorageAdapter } from './OpfsStorageAdapter';

class StorageManager {
  private static instance: StorageManager;
  private adapter: IBinaryStorageAdapter;

  private constructor() {
    if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
      this.adapter = new TauriFsStorageAdapter();
    } else {
      this.adapter = new OpfsStorageAdapter();
    }
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  public getAdapter(): IBinaryStorageAdapter {
    return this.adapter;
  }

  public setAdapter(adapter: IBinaryStorageAdapter): void {
    this.adapter = adapter;
  }
}

export const storageManager = StorageManager.getInstance();
export const getBinaryStorage = () => storageManager.getAdapter();
