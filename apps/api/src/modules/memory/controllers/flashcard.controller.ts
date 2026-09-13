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

  async getDailyDeck(req: Request, res: Response): Promise<void> {
    try {
      const dateStr = req.query.date as string | undefined
      const deck = await flashcardService.getDailyDeck(req.user!.userId, dateStr)
      res.json(deck)
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

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { annotationId, bookId, question, answer, contextSummary, cardType } = req.body
      const card = await flashcardService.create({
        userId: req.user!.userId,
        annotationId: Number(annotationId),
        bookId: Number(bookId) || 1,
        question,
        answer,
        contextSummary,
        cardType,
      })
      res.status(201).json({ card })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id))
      await flashcardService.delete(id, req.user!.userId)
      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async deleteByAnnotation(req: Request, res: Response): Promise<void> {
    try {
      const annotationId = parseInt(String(req.params.annotationId))
      await flashcardService.deleteByAnnotation(annotationId, req.user!.userId)
      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }
}

export const flashcardController = new FlashcardController()
