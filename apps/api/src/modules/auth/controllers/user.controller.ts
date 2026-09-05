import type { Request, Response } from 'express'
import { userService } from '../services/user.service'

export class UserController {
  async me(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.findById(req.user!.userId)
      if (!user) { res.status(404).json({ error: 'User not found' }); return }
      res.json({ user })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.findAll()
      res.json({ users })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }
}

export const userController = new UserController()
