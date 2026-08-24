import { vi } from 'vitest'

const g = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global) as any

if (g) {
  g.definePageMeta = vi.fn()
  g.navigateTo = vi.fn().mockResolvedValue(undefined)
  g.useRoute = () => ({
    path: '/',
    params: {},
    query: {},
    hash: '',
    fullPath: '/'
  })
  g.useRouter = () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  })
  g.$fetch = vi.fn()
}

