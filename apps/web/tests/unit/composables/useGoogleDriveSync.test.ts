import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useGoogleDriveSync } from '~/composables/useGoogleDriveSync'

const mockGoogleDriveToken = ref<string | null>('mock-token')
const mockIsGoogleDriveConnected = ref(true)
const mockEnsureGoogleDriveToken = vi.fn().mockResolvedValue('mock-token')
const mockRefreshGoogleToken = vi.fn().mockResolvedValue('refreshed-token')
const mockSetGoogleDriveToken = vi.fn()

vi.mock('~/composables/useOAuth', () => ({
  useOAuth: () => ({
    googleDriveToken: mockGoogleDriveToken,
    isGoogleDriveConnected: mockIsGoogleDriveConnected,
    ensureGoogleDriveToken: mockEnsureGoogleDriveToken,
    refreshGoogleToken: mockRefreshGoogleToken,
    setGoogleDriveToken: mockSetGoogleDriveToken,
  }),
}))

describe('useGoogleDriveSync Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGoogleDriveToken.value = 'mock-token'
    mockIsGoogleDriveConnected.value = true
  })

  it('downloadBookFromDrive deve baixar livro com sucesso pelo folderId', async () => {
    global.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = url.toString()
      if (urlStr.includes('folder_xyz') && urlStr.includes('fields=files')) {
        return new Response(
          JSON.stringify({
            files: [
              { id: 'f_epub', name: 'Livro.epub', mimeType: 'application/epub+zip' },
              { id: 'f_cover', name: 'cover.webp', mimeType: 'image/webp' },
            ],
          }),
          { status: 200 }
        )
      }
      if (urlStr.includes('f_epub') && urlStr.includes('alt=media')) {
        return new Response(new Blob(['conteudo-epub'], { type: 'application/epub+zip' }), { status: 200 })
      }
      if (urlStr.includes('f_cover') && urlStr.includes('alt=media')) {
        return new Response(new Blob(['conteudo-cover'], { type: 'image/webp' }), { status: 200 })
      }
      return new Response(JSON.stringify({ files: [] }), { status: 200 })
    }) as any

    const { downloadBookFromDrive } = useGoogleDriveSync()
    const result = await downloadBookFromDrive({ folderId: 'folder_xyz' })

    expect(result).not.toBeNull()
    expect(result?.fileName).toBe('Livro.epub')
    expect(result?.mimeType).toBe('application/epub+zip')
  })

  it('downloadBookFromDrive deve retornar null se não houver token ou se falhar', async () => {
    mockEnsureGoogleDriveToken.mockResolvedValueOnce(null)
    const { downloadBookFromDrive } = useGoogleDriveSync()
    const result = await downloadBookFromDrive({ folderId: 'folder_xyz' })
    expect(result).toBeNull()
  })
})
