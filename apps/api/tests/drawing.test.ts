import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../src/server'
import axios from 'axios'
import http from 'http'

describe('Drawings Endpoints (Deprecated / Local-First Migration)', () => {
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

  it('retorna 410 Gone ao acessar endpoints de desenhos no backend', async () => {
    try {
      await axios.get(`${baseUrl}/api/drawings`)
      expect.unreachable('Deveria ter retornado 410 Gone')
    } catch (err: any) {
      expect(err.response?.status).toBe(410)
      expect(err.response?.data?.message).toContain('Local-First')
    }
  })
})
