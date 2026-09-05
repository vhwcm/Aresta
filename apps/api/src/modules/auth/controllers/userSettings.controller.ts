import type { Request, Response } from 'express'
import { userSettingsService } from '../services/userSettings.service'

export class UserSettingsController {
  async get(req: Request, res: Response): Promise<void> {
    try {
      const settings = await userSettingsService.findByUser(req.user!.userId)
      res.json({ settings })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async upsert(req: Request, res: Response): Promise<void> {
    try {
      const settings = await userSettingsService.upsert(req.user!.userId, req.body)
      res.json({ settings })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }
}

export const userSettingsController = new UserSettingsController()
