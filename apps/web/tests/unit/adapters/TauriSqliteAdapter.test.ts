import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TauriSqliteAdapter } from '~/adapters/database/TauriSqliteAdapter'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn().mockRejectedValue(new Error('Command plugin:sql|load not allowed by ACL')),
  },
}))

describe('TauriSqliteAdapter & Tauri v2 Capabilities', () => {
  it('1. Capabilities default.json do Tauri v2 deve existir e conter permissões de SQL, FS e Dialog', () => {
    const capabilityPath = path.resolve(process.cwd(), 'src-tauri/capabilities/default.json')
    expect(fs.existsSync(capabilityPath)).toBe(true)

    const content = JSON.parse(fs.readFileSync(capabilityPath, 'utf-8'))
    expect(content.permissions).toContain('sql:default')
    expect(content.permissions).toContain('fs:default')
    expect(content.permissions).toContain('dialog:default')
    expect(content.permissions).toContain('core:default')
  })

  it('2. TauriSqliteAdapter deve ativar fallback resiliente para Dexie quando SQLite nativo falhar por ACL ou erro de driver', async () => {
    const adapter = new TauriSqliteAdapter()
    await expect(adapter.init()).resolves.not.toThrow()
    
    // Testa operações CRUD com o fallback ativo
    const fakeBook = {
      id: 9999,
      bookId: 9999,
      title: 'Livro Teste Fallback',
      author: 'Autor Teste',
      currentPage: 1,
      status: 'LENDO' as const,
      updated_at: new Date().toISOString(),
      sync_status: 'pending' as const,
    }

    await expect(adapter.saveBook(fakeBook)).resolves.not.toThrow()
    const books = await adapter.getBooks()
    expect(Array.isArray(books)).toBe(true)
  })
})
