import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../src/server'
import axios from 'axios'
import http from 'http'
import { authService } from '../src/modules/auth/services/auth.service'

describe('Multi-Tenant Data Isolation & Local-First Boundaries', () => {
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

  it('garante que rotas de dados pessoais retornam 410 Gone protegendo a privacidade', async () => {
    const timestamp = Date.now()

    // Cria Usuário A
    const userA = await authService.register({
      name: `User A ${timestamp}`,
      email: `user-a-${timestamp}@aresta.app`,
      password: 'password123',
    })

    // Garante que requisições para user-books retornam 410
    try {
      await axios.get(`${baseUrl}/api/user-books`, {
        headers: { Authorization: `Bearer ${userA.token}` },
      })
      expect.unreachable('Deveria ter retornado 410 Gone')
    } catch (err: any) {
      expect(err.response?.status).toBe(410)
    }

    // Garante que requisições para graph retornam 410
    try {
      await axios.get(`${baseUrl}/api/graph`, {
        headers: { Authorization: `Bearer ${userA.token}` },
      })
      expect.unreachable('Deveria ter retornado 410 Gone')
    } catch (err: any) {
      expect(err.response?.status).toBe(410)
    }
  })
})
