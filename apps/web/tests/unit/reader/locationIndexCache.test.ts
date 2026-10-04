import { describe, it, expect } from 'vitest'
import {
  computeBookHash,
  getCachedLocations,
  setCachedLocations
} from '~/utils/reader/epub/locationIndexCache'

describe('locationIndexCache', () => {
  it('gera hash determinístico para o mesmo buffer', async () => {
    const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
    const hash1 = await computeBookHash(data)
    const hash2 = await computeBookHash(data)

    expect(hash1).toBe(hash2)
    expect(hash1.length).toBeGreaterThan(0)
  })

  it('gera hashes diferentes para buffers diferentes', async () => {
    const data1 = new Uint8Array([1, 2, 3, 4])
    const data2 = new Uint8Array([5, 6, 7, 8])

    const hash1 = await computeBookHash(data1)
    const hash2 = await computeBookHash(data2)

    expect(hash1).not.toBe(hash2)
  })

  it('armazena e recupera localizações em cache', async () => {
    const hash = 'test-book-hash-1234'
    const locations = [1024, 2048, 512]

    await setCachedLocations(hash, locations)
    const retrieved = await getCachedLocations(hash)

    // Se IndexedDB estiver disponível no ambiente de teste, confere; senão lida com null gracefully
    if (typeof indexedDB !== 'undefined') {
      expect(retrieved).toEqual(locations)
    } else {
      expect(retrieved).toBeNull()
    }
  })
})
