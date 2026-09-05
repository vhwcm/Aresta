import type { Request, Response } from 'express'
import { bookService } from '../services/book.service'

export class BookController {
  async list(_req: Request, res: Response): Promise<void> {
    try {
      const books = await bookService.findAll()
      res.json({ books })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const book = await bookService.findById(parseInt(String(req.params.id)))
      res.json({ book })
    } catch (err: any) {
      res.status(404).json({ error: err.message })
    }
  }

  async getFile(req: Request, res: Response): Promise<void> {
    try {
      const filePath = await bookService.getFilePath(parseInt(String(req.params.id)))
      res.sendFile(filePath)
    } catch (err: any) {
      res.status(404).json({ error: err.message })
    }
  }

  async getCover(req: Request, res: Response): Promise<void> {
    try {
      const coverPath = await bookService.getCoverPath(parseInt(String(req.params.id)))
      res.sendFile(coverPath)
    } catch (err: any) {
      res.status(404).json({ error: err.message })
    }
  }
}

export const bookController = new BookController()

