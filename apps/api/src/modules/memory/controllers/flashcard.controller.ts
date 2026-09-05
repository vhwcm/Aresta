import type { Request, Response } from 'express'
import { flashcardService } from '../services/flashcard.service'

export class FlashcardController {
  async getDue(req: Request, res: Response): Promise<void> {
    try {
      const cards = await flashcardService.getDueCards(req.user!.userId)
      res.json({ cards })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async review(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id))
      const { rating } = req.body
      const card = await flashcardService.review(id, req.user!.userId, rating)
      res.json({ card })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const cards = await flashcardService.findByUser(req.user!.userId)
      res.json({ cards })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }
}

export const flashcardController = new FlashcardController()
