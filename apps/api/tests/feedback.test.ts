import { describe, it, expect, vi, beforeEach } from 'vitest'
import { feedbackService } from '../src/modules/feedback/services/feedback.service'
import { feedbackController } from '../src/modules/feedback/controllers/feedback.controller'
import { prisma } from '../src/config/prisma'
import type { Request, Response } from 'express'

describe('FeedbackService & FeedbackController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('FeedbackService', () => {
    it('cria feedback com sucesso associando ao user_id', async () => {
      const mockFeedback = {
        id: 1,
        user_id: 2,
        message: 'Excelente aplicativo, adoraria ver suporte a áudio.',
        type: 'IMPROVEMENT',
        created_at: new Date(),
        user: { id: 2, name: 'Viktor', email: 'viktor@aresta.org' },
      }

      const createSpy = vi.spyOn((prisma as any).feedback, 'create').mockResolvedValue(mockFeedback as any)

      const result = await feedbackService.create({
        userId: 2,
        message: 'Excelente aplicativo, adoraria ver suporte a áudio.',
        type: 'IMPROVEMENT',
      })

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: 2,
            message: 'Excelente aplicativo, adoraria ver suporte a áudio.',
            type: 'IMPROVEMENT',
          }),
        })
      )
      expect(result.id).toBe(1)
      expect(result.user_id).toBe(2)
      createSpy.mockRestore()
    })

    it('rejeita mensagem vazia ou em branco', async () => {
      await expect(
        feedbackService.create({
          userId: 2,
          message: '   ',
        })
      ).rejects.toThrow('A mensagem não pode estar vazia')
    })

    it('lista feedbacks ordenados por data decrescente', async () => {
      const mockList = [
        { id: 2, user_id: 1, message: 'Bug na fonte', type: 'BUG', created_at: new Date() },
        { id: 1, user_id: 2, message: 'Ótimo app', type: 'FEEDBACK', created_at: new Date() },
      ]
      const findManySpy = vi.spyOn((prisma as any).feedback, 'findMany').mockResolvedValue(mockList as any)

      const result = await feedbackService.list(10, 0)
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
          orderBy: { created_at: 'desc' },
        })
      )
      expect(result).toHaveLength(2)
      findManySpy.mockRestore()
    })
  })

  describe('FeedbackController', () => {
    it('retorna 201 ao enviar feedback válido', async () => {
      const createdItem = {
        id: 10,
        user_id: 5,
        message: 'Sugestão de atalho de teclado',
        type: 'IMPROVEMENT',
        created_at: new Date(),
      }
      vi.spyOn(feedbackService, 'create').mockResolvedValue(createdItem as any)

      const req = {
        user: { userId: 5, email: 'user@aresta.app' },
        body: { message: 'Sugestão de atalho de teclado', type: 'IMPROVEMENT' },
      } as unknown as Request

      const jsonMock = vi.fn()
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock })
      const res = {
        status: statusMock,
        json: jsonMock,
      } as unknown as Response

      await feedbackController.create(req, res)

      expect(statusMock).toHaveBeenCalledWith(201)
      expect(jsonMock).toHaveBeenCalledWith({ feedback: createdItem })
    })

    it('retorna 400 se o corpo não contiver mensagem', async () => {
      const req = {
        user: { userId: 5, email: 'user@aresta.app' },
        body: { message: '' },
      } as unknown as Request

      const jsonMock = vi.fn()
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock })
      const res = {
        status: statusMock,
        json: jsonMock,
      } as unknown as Response

      await feedbackController.create(req, res)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }))
    })

    it('retorna 401 se req.user for indefinido', async () => {
      const req = {
        body: { message: 'Mensagem sem usuário' },
      } as unknown as Request

      const jsonMock = vi.fn()
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock })
      const res = {
        status: statusMock,
        json: jsonMock,
      } as unknown as Response

      await feedbackController.create(req, res)

      expect(statusMock).toHaveBeenCalledWith(401)
    })
  })
})
