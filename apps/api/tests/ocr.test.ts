import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../src/server'
import axios from 'axios'
import http from 'http'
import { aiService } from '../src/modules/ai/services/ai.service'

describe('OCR Transcription Endpoint', () => {
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

  it('POST /api/ocr/transcribe retorna 400 se imageBase64 estiver ausente', async () => {
    try {
      await axios.post(`${baseUrl}/api/ocr/transcribe`, {})
      expect.fail('Deveria ter lançado erro 400')
    } catch (err: any) {
      expect(err.response.status).toBe(400)
      expect(err.response.data.error).toBeDefined()
    }
  })

  it('POST /api/ocr/transcribe aceita imagem válida em base64 e retorna text', async () => {
    // 1x1 transparent PNG em base64
    const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const res = await axios.post(`${baseUrl}/api/ocr/transcribe`, {
      imageBase64: validBase64,
      mimeType: 'image/png',
      promptHint: 'Transcreva o texto manuscrito',
    })

    expect(res.status).toBe(200)
    expect(res.data).toHaveProperty('text')
    expect(typeof res.data.text).toBe('string')
  })

  it('AiService.transcribeImage lança erro para imagem vazia', async () => {
    await expect(aiService.transcribeImage('')).rejects.toThrow('Buffer de imagem inválido ou vazio.')
  })
})
