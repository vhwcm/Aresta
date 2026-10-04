import { describe, it, expect, beforeEach } from 'vitest'
import { BookRepository } from '~/adapters/database/repositories/BookRepository'
import { InMemoryAdapter } from '~/adapters/database/InMemoryAdapter'
import { dbManager } from '~/adapters/database/DatabaseManager'

describe('BookRepository readingPosition and locationsData', () => {
  let inMemory: InMemoryAdapter
  let repo: BookRepository

  beforeEach(() => {
    inMemory = new InMemoryAdapter()
    // Injeta adapter InMemory para os testes
    ;(dbManager as any).activeAdapter = inMemory
    repo = new BookRepository()
  })

  it('salva e recupera readingPosition e locationsData', async () => {
    const saved = await repo.save({
      id: 10,
      bookId: 10,
      title: 'Livro Teste',
      currentPage: 3,
      readingPosition: 'epub:2:512',
      totalLocations: 120,
      locationsData: [1024, 2048, 4096]
    })

    expect(saved.readingPosition).toBe('epub:2:512')
    expect(saved.totalLocations).toBe(120)
    expect(saved.locationsData).toEqual([1024, 2048, 4096])

    const retrieved = await repo.getById(10)
    expect(retrieved).not.toBeNull()
    expect(retrieved?.readingPosition).toBe('epub:2:512')
    expect(retrieved?.totalLocations).toBe(120)
    expect(retrieved?.locationsData).toEqual([1024, 2048, 4096])
  })

  it('preserva readingPosition pré-existente se update omitir o campo', async () => {
    await repo.save({
      id: 15,
      bookId: 15,
      title: 'Livro Parcial',
      currentPage: 1,
      readingPosition: 'epub:0:100',
      totalLocations: 50,
      locationsData: [50000]
    })

    // Atualização parcial de página
    await repo.save({
      id: 15,
      bookId: 15,
      title: 'Livro Parcial',
      currentPage: 2
    })

    const updated = await repo.getById(15)
    expect(updated?.currentPage).toBe(2)
    expect(updated?.readingPosition).toBe('epub:0:100')
    expect(updated?.totalLocations).toBe(50)
    expect(updated?.locationsData).toEqual([50000])
  })

  it('permite fallback para currentPage quando readingPosition for nula', async () => {
    await repo.save({
      id: 20,
      bookId: 20,
      title: 'Livro Antigo',
      currentPage: 42
    })

    const book = await repo.getById(20)
    expect(book?.readingPosition).toBeNull()
    expect(book?.currentPage).toBe(42)
  })
})
