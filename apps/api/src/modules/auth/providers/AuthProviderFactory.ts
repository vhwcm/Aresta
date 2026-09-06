import type { IAuthProvider } from './IAuthProvider'
import { GoogleAuthProvider } from './GoogleAuthProvider'
import { MicrosoftAuthProvider } from './MicrosoftAuthProvider'
import { AppleAuthProvider } from './AppleAuthProvider'

export type SupportedAuthProvider = 'google' | 'microsoft' | 'apple'

export class AuthProviderFactory {
  private static providers: Map<string, IAuthProvider> = new Map()

  static getProvider(provider: SupportedAuthProvider | string): IAuthProvider {
    const key = provider.toLowerCase()

    if (this.providers.has(key)) {
      return this.providers.get(key)!
    }

    let instance: IAuthProvider

    switch (key) {
      case 'google':
        instance = new GoogleAuthProvider()
        break
      case 'microsoft':
        instance = new MicrosoftAuthProvider()
        break
      case 'apple':
        instance = new AppleAuthProvider()
        break
      default:
        throw new Error(`Provedor de autenticação não suportado: ${provider}`)
    }

    this.providers.set(key, instance)
    return instance
  }

  static registerProvider(provider: IAuthProvider): void {
    this.providers.set(provider.providerName.toLowerCase(), provider)
  }

  static clearProviders(): void {
    this.providers.clear()
  }
}
