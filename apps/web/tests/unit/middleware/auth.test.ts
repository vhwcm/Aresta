import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import authMiddleware from '~/middleware/auth'

const mockIsLoggedIn = ref(false)

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    isLoggedIn: mockIsLoggedIn,
  }),
}))

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoggedIn.value = false
  })

  it('redirects to /login with redirect query when user is not authenticated', () => {
    const to = { fullPath: '/canvas?action=new' } as any
    authMiddleware(to, {} as any)
    expect(globalThis.navigateTo).toHaveBeenCalledWith('/login?redirect=%2Fcanvas%3Faction%3Dnew')
  })

  it('allows navigation when user is authenticated', () => {
    mockIsLoggedIn.value = true
    const to = { fullPath: '/canvas' } as any
    const result = authMiddleware(to, {} as any)
    expect(result).toBeUndefined()
    expect(globalThis.navigateTo).not.toHaveBeenCalled()
  })
})
