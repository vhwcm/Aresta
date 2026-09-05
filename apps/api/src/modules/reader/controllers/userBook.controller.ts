import type { Request, Response } from 'express'
import { userBookService } from '../services/userBook.service'

export class UserBookController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const books = await userBookService.findByUser(req.user!.userId)
      res.json({ books })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async upsert(req: Request, res: Response): Promise<void> {
    try {
      const bookId = parseInt(String(req.params.bookId))
      const userBook = await userBookService.upsert(req.user!.userId, bookId, req.body)
      res.json({ userBook })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }
}

export const userBookController = new UserBookController()
