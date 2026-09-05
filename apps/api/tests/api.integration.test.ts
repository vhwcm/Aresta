import { describe, it, expect } from 'vitest'
import app from '../src/server'
import axios from 'axios'
import http from 'http'

describe('Unified Monolith API Integration', () => {
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

  it('GET /health retorna status ok e todos os 5 módulos unificados', async () => {
    const res = await axios.get(`${baseUrl}/health`)
    expect(res.status).toBe(200)
    expect(res.data.status).toBe('ok')
    expect(res.data.service).toBe('aresta-api')
    expect(res.data.modules).toEqual(['auth', 'reader', 'canvas', 'memory', 'ai'])
  })

  it('POST /api/auth/login autentica o usuário admin semeado', async () => {
    const res = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'admin@aresta.app',
      password: 'admin123',
    })
    expect(res.status).toBe(200)
    expect(res.data).toHaveProperty('token')
    expect(res.data.user.email).toBe('admin@aresta.app')
  })

  it('GET /api/canvases lista quadros com token JWT', async () => {
    const loginRes = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'admin@aresta.app',
      password: 'admin123',
    })
    const token = loginRes.data.token

    const res = await axios.get(`${baseUrl}/api/canvases`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    expect(Array.isArray(res.data.canvases || res.data)).toBe(true)
  })

  it('GET /api/books lista livros com token JWT', async () => {
    const loginRes = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'admin@aresta.app',
      password: 'admin123',
    })
    const token = loginRes.data.token

    const res = await axios.get(`${baseUrl}/api/books`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    expect(Array.isArray(res.data.books || res.data)).toBe(true)
  })
})
