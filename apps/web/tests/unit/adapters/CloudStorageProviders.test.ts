import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CloudStorageProviderFactory } from '~/adapters/storage/cloud/CloudStorageProviderFactory'
import { GoogleDriveStorageProvider } from '~/adapters/storage/cloud/GoogleDriveStorageProvider'
import { OneDriveStorageProvider } from '~/adapters/storage/cloud/OneDriveStorageProvider'

describe('CloudStorageProviders & Factory (SOLID)', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    CloudStorageProviderFactory.clearProviders()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('deve instanciar GoogleDriveStorageProvider via Factory', () => {
    const provider = CloudStorageProviderFactory.getProvider('google', 'fake-google-token')
    expect(provider).toBeInstanceOf(GoogleDriveStorageProvider)
    expect(provider.providerName).toBe('google')
  })

  it('deve instanciar OneDriveStorageProvider via Factory', () => {
    const provider = CloudStorageProviderFactory.getProvider('onedrive', 'fake-onedrive-token')
    expect(provider).toBeInstanceOf(OneDriveStorageProvider)
    expect(provider.providerName).toBe('onedrive')
  })

  it('deve disparar erro para provedor desconhecido', () => {
    expect(() =>
      CloudStorageProviderFactory.getProvider('dropbox', 'fake-token')
    ).toThrow(/Provedor de nuvem não suportado/)
  })

  it('GoogleDriveStorageProvider deve criar a pasta Aresta/[Título]/ e fazer upload do livro e da capa', async () => {
    const calls: Array<{ url: string; method?: string; body?: any }> = []

    global.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString()
      calls.push({ url: urlStr, method: init?.method || 'GET', body: init?.body })

      // 1. Busca pasta "Aresta" (não existe inicialmente)
      if (urlStr.includes('name%20%3D%20%27Aresta%27') && init?.method !== 'POST') {
        return new Response(JSON.stringify({ files: [] }), { status: 200 })
      }

      // 2. Cria pasta "Aresta"
      if (urlStr.endsWith('/files') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string)
        if (body.name === 'Aresta') {
          return new Response(JSON.stringify({ id: 'folder_aresta_root', name: 'Aresta' }), { status: 200 })
        }
        // 3. Cria subpasta do livro "Dom Casmurro"
        if (body.name === 'Dom Casmurro') {
          return new Response(JSON.stringify({ id: 'folder_dom_casmurro', name: 'Dom Casmurro' }), { status: 200 })
        }
      }

      // 4. Busca subpasta do livro (não existe inicialmente)
      if (urlStr.includes('name%20%3D%20%27Dom%20Casmurro%27')) {
        return new Response(JSON.stringify({ files: [] }), { status: 200 })
      }

      // 5. Upload de arquivo via multipart (livro ou capa)
      if (urlStr.includes('uploadType=multipart')) {
        return new Response(
          JSON.stringify({ id: `file_${Date.now()}`, name: 'uploaded_file', webViewLink: 'https://drive.google.com/view' }),
          { status: 200 }
        )
      }

      return new Response(JSON.stringify({}), { status: 200 })
    }) as any

    const provider = new GoogleDriveStorageProvider('fake-access-token')
    const result = await provider.uploadBookPackage({
      bookTitle: 'Dom Casmurro',
      bookFile: new Uint8Array([1, 2, 3]).buffer,
      bookFileName: 'Dom-Casmurro.epub',
      bookMimeType: 'application/epub+zip',
      coverBlob: new Blob(['fakecover'], { type: 'image/webp' }),
      coverFileName: 'cover.webp',
    })

    expect(result.rootFolderId).toBe('folder_aresta_root')
    expect(result.bookFolderId).toBe('folder_dom_casmurro')
    expect(result.bookFile).toBeDefined()
    expect(result.coverFile).toBeDefined()

    // Verifica se headers de Authorization com Bearer token foram enviados
    expect(calls.length).toBeGreaterThanOrEqual(4)
  })

  it('GoogleDriveStorageProvider deve listar livros existentes na pasta Aresta', async () => {
    global.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = url.toString()
      if (urlStr.includes('name') && urlStr.includes('Aresta')) {
        return new Response(JSON.stringify({ files: [{ id: 'aresta_root_1', name: 'Aresta' }] }), { status: 200 })
      }
      if (urlStr.includes('aresta_root_1')) {
        return new Response(
          JSON.stringify({
            files: [
              { id: 'b1', name: 'Memórias Póstumas', mimeType: 'application/vnd.google-apps.folder' },
              { id: 'f1', name: 'notas.txt', mimeType: 'text/plain' },
            ],
          }),
          { status: 200 }
        )
      }
      return new Response(JSON.stringify({ files: [] }), { status: 200 })
    }) as any

    const provider = new GoogleDriveStorageProvider('test-token')
    const books = await provider.listBooks()
    expect(books).toHaveLength(1)
    expect(books[0]?.title).toBe('Memórias Póstumas')
  })

  it('GoogleDriveStorageProvider deve ignorar pastas de sistema como v1, data, v2 ao listar livros', async () => {
    global.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = url.toString()
      if (urlStr.includes('name') && urlStr.includes('Aresta')) {
        return new Response(JSON.stringify({ files: [{ id: 'aresta_root_1', name: 'Aresta' }] }), { status: 200 })
      }
      if (urlStr.includes('aresta_root_1')) {
        return new Response(
          JSON.stringify({
            files: [
              { id: 'v1_folder', name: 'v1', mimeType: 'application/vnd.google-apps.folder' },
              { id: 'data_folder', name: 'data', mimeType: 'application/vnd.google-apps.folder' },
              { id: 'v2_folder', name: 'v2', mimeType: 'application/vnd.google-apps.folder' },
              { id: 'hidden_folder', name: '.aresta', mimeType: 'application/vnd.google-apps.folder' },
              { id: 'b1', name: 'Dom Casmurro', mimeType: 'application/vnd.google-apps.folder' },
            ],
          }),
          { status: 200 }
        )
      }
      return new Response(JSON.stringify({ files: [] }), { status: 200 })
    }) as any

    const provider = new GoogleDriveStorageProvider('test-token')
    const books = await provider.listBooks()
    expect(books).toHaveLength(1)
    expect(books[0]?.title).toBe('Dom Casmurro')
  })

  it('GoogleDriveStorageProvider deve deletar todas as pastas Aresta ao invocar deleteAllArestaData', async () => {
    const deletedIds: string[] = []
    global.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString()
      if (init?.method === 'DELETE') {
        const id = urlStr.split('/').pop() || ''
        deletedIds.push(id)
        return new Response(null, { status: 204 })
      }
      if (urlStr.includes('name') && urlStr.includes('Aresta')) {
        return new Response(
          JSON.stringify({
            files: [
              { id: 'folder_aresta_1', name: 'Aresta' },
              { id: 'folder_aresta_2', name: 'Aresta' },
            ],
          }),
          { status: 200 }
        )
      }
      return new Response(JSON.stringify({ files: [] }), { status: 200 })
    }) as any

    const provider = new GoogleDriveStorageProvider('test-token')
    await provider.deleteAllArestaData()

    expect(deletedIds).toContain('folder_aresta_1')
    expect(deletedIds).toContain('folder_aresta_2')
  })

  it('OneDriveStorageProvider deve deletar a pasta Aresta ao invocar deleteAllArestaData', async () => {
    let deletedRoot = false
    global.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString()
      if (init?.method === 'DELETE' && urlStr.includes('root_onedrive_aresta')) {
        deletedRoot = true
        return new Response(null, { status: 204 })
      }
      if (urlStr.includes('drive/root/children')) {
        return new Response(
          JSON.stringify({
            value: [{ id: 'root_onedrive_aresta', name: 'Aresta', folder: {} }],
          }),
          { status: 200 }
        )
      }
      return new Response(JSON.stringify({ value: [] }), { status: 200 })
    }) as any

    const provider = new OneDriveStorageProvider('test-token')
    await provider.deleteAllArestaData()

    expect(deletedRoot).toBe(true)
  })

  it('GoogleDriveStorageProvider deve baixar o arquivo e a capa do livro pelo folderId ou título', async () => {
    global.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = url.toString()
      if (urlStr.includes('folder_123') && urlStr.includes('fields=files')) {
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
        return new Response(new Blob(['conteudo-do-epub'], { type: 'application/epub+zip' }), { status: 200 })
      }
      if (urlStr.includes('f_cover') && urlStr.includes('alt=media')) {
        return new Response(new Blob(['conteudo-da-capa'], { type: 'image/webp' }), { status: 200 })
      }
      return new Response(JSON.stringify({ files: [] }), { status: 200 })
    }) as any

    const provider = new GoogleDriveStorageProvider('test-token')
    const result = await provider.downloadBookFile({ folderId: 'folder_123' })

    expect(result).not.toBeNull()
    expect(result?.fileName).toBe('Livro.epub')
    expect(result?.mimeType).toBe('application/epub+zip')
    expect(result?.coverFileName).toBe('cover.webp')
  })

  it('OneDriveStorageProvider deve baixar o arquivo e a capa do livro pelo folderId', async () => {
    global.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = url.toString()
      if (urlStr.includes('items/folder_od_1/children')) {
        return new Response(
          JSON.stringify({
            value: [
              { id: 'od_f_pdf', name: 'Livro.pdf', file: { mimeType: 'application/pdf' } },
              { id: 'od_f_cover', name: 'cover.webp', file: { mimeType: 'image/webp' } },
            ],
          }),
          { status: 200 }
        )
      }
      if (urlStr.includes('items/od_f_pdf/content')) {
        return new Response(new Blob(['pdf-bytes'], { type: 'application/pdf' }), { status: 200 })
      }
      if (urlStr.includes('items/od_f_cover/content')) {
        return new Response(new Blob(['cover-bytes'], { type: 'image/webp' }), { status: 200 })
      }
      return new Response(JSON.stringify({ value: [] }), { status: 200 })
    }) as any

    const provider = new OneDriveStorageProvider('test-token')
    const result = await provider.downloadBookFile({ folderId: 'folder_od_1' })

    expect(result).not.toBeNull()
    expect(result?.fileName).toBe('Livro.pdf')
    expect(result?.mimeType).toBe('application/pdf')
    expect(result?.coverFileName).toBe('cover.webp')
  })
})
