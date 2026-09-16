import { describe, it, expect, vi, beforeEach } from 'vitest'
import { bookService } from '../src/modules/reader/services/book.service'
import { prisma } from '../src/modules/reader/config/database'
import axios from 'axios'
import http from 'http'
import app from '../src/server'

describe('BookService & Public Catalog (Local-First Reader Boundary)', () => {
  let server: http.Server
  let baseUrl: string

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address()
        if (addr && typeof addr === 'object') {
          baseUrl = `http://localhost:${addr.port}`
        }
        resolve()
      })
    })
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
    })
  })

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('lista livros do catálogo público via bookService.findAll', async () => {
    const mockBooks = [
      { id: 1, title: 'Dom Casmurro', author: 'Machado de Assis', is_public: true },
      { id: 2, title: 'O Alienista', author: 'Machado de Assis', is_public: true },
    ]

    vi.spyOn(prisma.book, 'findMany').mockResolvedValue(mockBooks as any)

    const result = await bookService.findAll()
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Dom Casmurro')
  })

  it('busca livro por id via bookService.findById', async () => {
    const mockBook = {
      id: 1,
      title: 'Dom Casmurro',
      author: 'Machado de Assis',
      is_public: true,
      publicInfo: { author: 'Machado de Assis', summary: 'Clássico da literatura' },
    }

    vi.spyOn(prisma.book, 'findUnique').mockResolvedValue(mockBook as any)

    const result = await bookService.findById(1)
    expect(result?.title).toBe('Dom Casmurro')
    expect(result?.summary).toBe('Clássico da literatura')
  })

  it('retorna 410 Gone para endpoint legado /api/user-books', async () => {
    try {
      await axios.get(`${baseUrl}/api/user-books`)
      expect.unreachable('Deveria retornar 410')
    } catch (err: any) {
      expect(err.response?.status).toBe(410)
    }
  })
})
