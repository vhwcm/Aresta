import type { Request, Response } from 'express'

export class UserSettingsController {
  async get(_req: Request, res: Response): Promise<void> {
    res.status(410).json({ error: 'Endpoint descontinuado. Utilizar armazenamento Local-First.' })
  }

  async upsert(_req: Request, res: Response): Promise<void> {
    res.status(410).json({ error: 'Endpoint descontinuado. Utilizar armazenamento Local-First.' })
  }
}

export const userSettingsController = new UserSettingsController()
