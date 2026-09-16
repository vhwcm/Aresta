import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../src/server'
import axios from 'axios'
import http from 'http'
import { authService } from '../src/modules/auth/services/auth.service'
import { graphService } from '../src/modules/memory/services/graph.service'
import { userBookService } from '../src/modules/reader/services/userBook.service'

describe('Multi-Tenant Data Isolation (Books & Themes)', () => {
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

  it('garante que uma nova conta não vê livros nem temas criados por outro usuário', async () => {
    const timestamp = Date.now()

    // 1. Cria Usuário A
    const userA = await authService.register({
      name: `User A ${timestamp}`,
      email: `user-a-${timestamp}@aresta.app`,
      password: 'password123',
    })

    // 2. Usuário A cria um tema e um livro
    const themeA = await graphService.createNode(userA.user.id, `Tema A ${timestamp}`, '#FF5500', 'Tema do User A')
    const bookA = await userBookService.registerUploadedBook(userA.user.id, {
      title: `Livro do User A ${timestamp}`,
      author: 'Autor A',
      filePath: `path/to/book-a-${timestamp}.epub`,
      fileType: 'epub',
      status: 'LENDO',
    })
    await userBookService.addTheme(userA.user.id, bookA.id, themeA.id)

    // 3. Cria Usuário B (Nova conta)
    const userB = await authService.register({
      name: `User B ${timestamp}`,
      email: `user-b-${timestamp}@aresta.app`,
      password: 'password123',
    })

    // 4. Usuário B consulta seus livros
    const resBooks = await axios.get(`${baseUrl}/api/user-books`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    })
    expect(resBooks.status).toBe(200)
    expect(resBooks.data).toEqual([])

    // 5. Usuário B consulta seu grafo
    const resGraph = await axios.get(`${baseUrl}/api/graph`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    })
    expect(resGraph.status).toBe(200)

    // Verifica que nenhum tema ou livro do Usuário A aparece no grafo do Usuário B
    const themeIds = (resGraph.data.nodes || [])
      .filter((n: any) => n.type === 'theme')
      .map((n: any) => n.id)
    expect(themeIds).not.toContain(themeA.id)

    const bookIds = (resGraph.data.nodes || [])
      .filter((n: any) => n.type === 'book')
      .map((n: any) => n.rawId)
    expect(bookIds).not.toContain(bookA.book_id)

    // 6. Usuário B consulta /api/graph/themes
    const resThemes = await axios.get(`${baseUrl}/api/graph/themes`, {
      headers: { Authorization: `Bearer ${userB.token}` },
    })
    expect(resThemes.status).toBe(200)
    const returnedThemeIds = (resThemes.data.themes || []).map((t: any) => t.id)
    expect(returnedThemeIds).not.toContain(themeA.id)
  })
})
