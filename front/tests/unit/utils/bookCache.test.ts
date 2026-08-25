import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCachedBook, saveCachedBook, deleteCachedBook } from '~/utils/bookCache'

describe('bookCache', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('handles environment without indexedDB gracefully', async () => {
    const originalIndexedDB = window.indexedDB
    // @ts-expect-error - simulating no indexedDB
    window.indexedDB = undefined

    const cached = await getCachedBook('123')
    expect(cached).toBeNull()

    const buffer = new Uint8Array([1, 2, 3]).buffer
    const saved = await saveCachedBook('123', buffer, 'Test', 'pdf')
    expect(saved).toBe(false)

    window.indexedDB = originalIndexedDB
  })
})

