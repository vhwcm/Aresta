import type { Request, Response } from 'express'
import { feedbackService } from '../services/feedback.service'

export class FeedbackController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' })
        return
      }

      const { message, type } = req.body
      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'O campo mensagem é obrigatório' })
        return
      }

      const feedback = await feedbackService.create({
        userId,
        message,
        type,
      })

      res.status(201).json({ feedback })
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao enviar feedback' })
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 50
      const offset = Number(req.query.offset) || 0
      const feedbacks = await feedbackService.list(limit, offset)
      res.json({ feedbacks })
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar feedbacks' })
    }
  }
}

export const feedbackController = new FeedbackController()
