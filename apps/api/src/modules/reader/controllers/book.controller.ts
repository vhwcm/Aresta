import type { Request, Response } from 'express'
import { bookService } from '../services/book.service'

export class BookController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const books = await bookService.findAll(userId)
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
      const id = parseInt(String(req.params.id))
      const didacticBooklet = await bookService.getDidacticBooklet(id)
      if (didacticBooklet) {
        res.setHeader('Content-Type', 'application/json')
        res.json({
          title: didacticBooklet.title,
          chapters: didacticBooklet.chapters,
          booklet: didacticBooklet,
        })
        return
      }

      const filePath = await bookService.getFilePath(id)
      res.sendFile(filePath)
    } catch (err: any) {
      res.status(404).json({ error: err.message })
    }
  }

  async getCover(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id))
      const book = await bookService.findById(id)
      if (book?.coverPath && book.coverPath.startsWith('data:')) {
        const matches = book.coverPath.match(/^data:([^;]+);base64,(.*)$/)
        if (matches) {
          const mimeType = matches[1]
          const buffer = Buffer.from(matches[2], 'base64')
          res.setHeader('Content-Type', mimeType)
          res.send(buffer)
          return
        }
      }
      const coverPath = await bookService.getCoverPath(id)
      res.sendFile(coverPath)
    } catch (err: any) {
      res.status(404).json({ error: err.message })
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id))
      await bookService.delete(id)
      res.json({ success: true })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }
}

export const bookController = new BookController()

