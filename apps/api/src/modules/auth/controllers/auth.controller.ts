import type { Request, Response } from 'express'
import { authService } from '../services/auth.service'
import { RegisterSchema, LoginSchema } from '../schemas/auth.schema'

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const data = RegisterSchema.parse(req.body)
      const result = await authService.register(data)
      res.status(201).json(result)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const data = LoginSchema.parse(req.body)
      const result = await authService.login(data)
      res.json(result)
    } catch (err: any) {
      res.status(401).json({ error: err.message })
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    res.json({ user: req.user })
  }

  async deleteMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      await authService.deleteAccount(userId)
      res.json({ success: true, message: 'Account deleted successfully' })
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete account' })
    }
  }
}

export const authController = new AuthController()
