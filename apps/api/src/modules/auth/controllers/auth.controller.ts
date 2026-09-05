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
}

export const authController = new AuthController()
