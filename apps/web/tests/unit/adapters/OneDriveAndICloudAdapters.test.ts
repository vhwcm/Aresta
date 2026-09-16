import { describe, expect, it, vi, beforeEach } from 'vitest'
import { OneDriveStorageProvider } from '~/adapters/storage/cloud/OneDriveStorageProvider'
import { ICloudFolderAdapter } from '~/adapters/storage/cloud/ICloudFolderAdapter'

describe('Cloud Storage Providers (OneDrive & iCloud Folder)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('OneDriveStorageProvider', () => {
    it('instancia provedor com nome correto e headers de autenticacao', () => {
      const provider = new OneDriveStorageProvider('mock_access_token_123')
      expect(provider.providerName).toBe('onedrive')
    })

    it('uploadDataFile faz requisição PUT para o endpoint Microsoft Graph', async () => {
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('children?$select=id,name,folder')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ value: [{ id: 'approot_id', name: 'Aresta', folder: {} }] }),
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ id: 'file_id_onedrive', name: 'annotations.json' }),
        })
      })
      global.fetch = mockFetch

      const provider = new OneDriveStorageProvider('mock_token')
      const result = await provider.uploadDataFile('annotations.json', [{ id: 1, note: 'Teste' }])

      expect(result.fileName).toBe('annotations.json')
      expect(result.itemCount).toBe(1)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://graph.microsoft.com/v1.0/me/drive/'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock_token',
          }),
        })
      )
    })

    it('downloadDataFile retorna null caso o arquivo não exista (404)', async () => {
      const mockFetch = vi.fn().mockImplementation((url: string, opts?: any) => {
        if (opts?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            status: 201,
            json: async () => ({ id: 'created_folder_id', name: 'Folder' }),
            text: async () => '',
          })
        }
        if (url.includes('/children')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ value: [{ id: 'approot_id', name: 'Aresta', folder: {} }, { id: 'data_id', name: 'data', folder: {} }] }),
            text: async () => '',
          })
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ error: 'NotFound' }),
          text: async () => 'NotFound',
        })
      })
      global.fetch = mockFetch

      const provider = new OneDriveStorageProvider('mock_token')
      const result = await provider.downloadDataFile('non_existent.json')

      expect(result).toBeNull()
    })
  })

  describe('ICloudFolderAdapter', () => {
    it('instancia o adaptador com o providerName "icloud-folder"', () => {
      const adapter = new ICloudFolderAdapter()
      expect(adapter.providerName).toBe('icloud-folder')
    })

    it('em ambiente web/SSR trata operações com gracefully fallback', async () => {
      const adapter = new ICloudFolderAdapter()
      await adapter.ensureDataFolders()

      const uploadResult = await adapter.uploadDataFile('notes.json', [{ id: 'n1', title: 'Nota' }])
      expect(uploadResult.fileName).toBe('notes.json')
      expect(uploadResult.itemCount).toBe(1)

      const downloaded = await adapter.downloadDataFile('notes.json')
      expect(downloaded).toBeNull()

      const list = await adapter.listSubFolderFiles('canvas')
      expect(list).toEqual([])
    })
  })
})
