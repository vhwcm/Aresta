interface CacheEntry<T> {
  value: T
  expiresAt: number | null
  tags: string[]
  lastAccessed: number
}

export class CacheManager {
  private static instance: CacheManager
  private store = new Map<string, CacheEntry<any>>()
  private tagIndex = new Map<string, Set<string>>()
  private maxEntries: number
  private defaultTtlSeconds: number

  private constructor(maxEntries = 5000, defaultTtlSeconds = 600) {
    this.maxEntries = maxEntries
    this.defaultTtlSeconds = defaultTtlSeconds

    // Limpeza periódica de entradas expiradas a cada 5 minutos
    if (typeof setInterval !== 'undefined') {
      const interval = setInterval(() => {
        this.prune()
      }, 5 * 60 * 1000)
      if (typeof interval === 'object' && 'unref' in interval) {
        interval.unref()
      }
    }
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  public get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.invalidateKey(key)
      return null
    }

    entry.lastAccessed = Date.now()
    return entry.value as T
  }

  public set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    tags: string[] = []
  ): void {
    if (this.store.size >= this.maxEntries) {
      this.evictOldest()
    }

    // Remove referências de tags antigas caso a chave já exista
    if (this.store.has(key)) {
      this.removeKeyFromTags(key)
    }

    const ttl = ttlSeconds !== undefined ? ttlSeconds : this.defaultTtlSeconds
    const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : null

    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      tags,
      lastAccessed: Date.now(),
    }

    this.store.set(key, entry)

    // Indexar tags
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(key)
    }
  }

  public invalidateKey(key: string): void {
    this.removeKeyFromTags(key)
    this.store.delete(key)
  }

  public invalidateTag(tag: string): void {
    const keys = this.tagIndex.get(tag)
    if (keys) {
      for (const key of Array.from(keys)) {
        this.store.delete(key)
      }
      this.tagIndex.delete(tag)
    }
  }

  public invalidateTags(tags: string[]): void {
    for (const tag of tags) {
      this.invalidateTag(tag)
    }
  }

  public invalidateUser(userId: number | string): void {
    const userPrefix = `user:${userId}:`
    // Invalida todas as tags do usuário
    const tagsToInvalidate: string[] = []
    for (const tag of this.tagIndex.keys()) {
      if (tag.startsWith(userPrefix) || tag === `user:${userId}`) {
        tagsToInvalidate.push(tag)
      }
    }
    for (const tag of tagsToInvalidate) {
      this.invalidateTag(tag)
    }

    // Invalida chaves diretas que possam começar com userPrefix
    const keysToDelete: string[] = []
    for (const key of this.store.keys()) {
      if (key.startsWith(userPrefix)) {
        keysToDelete.push(key)
      }
    }
    for (const key of keysToDelete) {
      this.invalidateKey(key)
    }
  }

  public clear(): void {
    this.store.clear()
    this.tagIndex.clear()
  }

  public prune(): void {
    const now = Date.now()
    const expiredKeys: string[] = []
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expiredKeys.push(key)
      }
    }
    for (const key of expiredKeys) {
      this.invalidateKey(key)
    }
  }

  public size(): number {
    return this.store.size
  }

  private removeKeyFromTags(key: string): void {
    const entry = this.store.get(key)
    if (!entry) return
    for (const tag of entry.tags) {
      const set = this.tagIndex.get(tag)
      if (set) {
        set.delete(key)
        if (set.size === 0) {
          this.tagIndex.delete(tag)
        }
      }
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.invalidateKey(oldestKey)
    }
  }
}

export const cacheManager = CacheManager.getInstance()
