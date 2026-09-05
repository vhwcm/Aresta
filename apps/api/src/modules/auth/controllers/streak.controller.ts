import type { Request, Response } from 'express'
import { streakService } from '../services/streak.service'

export class StreakController {
  async getStreak(req: Request, res: Response): Promise<void> {
    try {
      const status = await streakService.getStreakStatus(req.user!.userId)
      res.json(status)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async recordReadingTime(req: Request, res: Response): Promise<void> {
    try {
      const { reading_seconds } = req.body
      const result = await streakService.recordReadingTime(req.user!.userId, reading_seconds)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async recordFlashcardReview(req: Request, res: Response): Promise<void> {
    try {
      const { count = 1 } = req.body || {}
      const result = await streakService.recordFlashcardReview(req.user!.userId, count)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async updateStreakTarget(req: Request, res: Response): Promise<void> {
    try {
      const { target_days } = req.body
      const result = await streakService.updateStreakTarget(req.user!.userId, target_days)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }
}

export const streakController = new StreakController()
