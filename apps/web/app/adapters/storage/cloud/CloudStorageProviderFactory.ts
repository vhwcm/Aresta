import type { ICloudStorageProvider } from './ICloudStorageProvider'
import { GoogleDriveStorageProvider } from './GoogleDriveStorageProvider'
import { OneDriveStorageProvider } from './OneDriveStorageProvider'
import { ICloudFolderAdapter } from './ICloudFolderAdapter'

export type SupportedCloudStorage = 'google' | 'onedrive' | 'icloud-folder'

export class CloudStorageProviderFactory {
  private static providers: Map<string, ICloudStorageProvider> = new Map()

  static getProvider(
    providerName: SupportedCloudStorage | string,
    tokenOrGetter?: string | (() => string | null)
  ): ICloudStorageProvider {
    const key = providerName.toLowerCase()

    if (tokenOrGetter) {
      let instance: ICloudStorageProvider
      switch (key) {
        case 'google':
          instance = new GoogleDriveStorageProvider(tokenOrGetter)
          break
        case 'onedrive':
          instance = new OneDriveStorageProvider(tokenOrGetter)
          break
        case 'icloud-folder':
          instance = new ICloudFolderAdapter()
          break
        default:
          throw new Error(`Provedor de nuvem não suportado: ${providerName}`)
      }
      this.providers.set(key, instance)
      return instance
    }

    if (this.providers.has(key)) {
      return this.providers.get(key)!
    }

    throw new Error(
      `Provedor ${providerName} ainda não foi inicializado com credenciais/tokens de acesso.`
    )
  }

  static registerProvider(provider: ICloudStorageProvider): void {
    this.providers.set(provider.providerName.toLowerCase(), provider)
  }

  static clearProviders(): void {
    this.providers.clear()
  }
}
