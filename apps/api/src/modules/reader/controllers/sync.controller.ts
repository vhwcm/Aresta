import type { Request, Response } from 'express'
import { syncService } from '../services/sync.service'

export class SyncController {
  async sync(req: Request, res: Response): Promise<void> {
    try {
      const result = await syncService.processSync(req.user!.userId, req.body)
      res.json(result)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }
}

export const syncController = new SyncController()
