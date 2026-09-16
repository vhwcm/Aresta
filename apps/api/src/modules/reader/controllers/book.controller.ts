import type { Request, Response } from 'express'
import { bookService } from '../services/book.service'

export class BookController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId
      const books = await bookService.findAll(userId)
      res.json({ books })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId
      const book = await bookService.findByIdForUser(parseInt(String(req.params.id)), userId)
      res.json({ book })
    } catch (err: any) {
      res.status(err.status ?? 404).json({ error: err.message })
    }
  }

  async getFile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId
      const id = parseInt(String(req.params.id))

      // Verifica ownership antes de servir o arquivo
      await bookService.findByIdForUser(id, userId)

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
      res.status(err.status ?? 404).json({ error: err.message })
    }
  }

  async getCover(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId
      const id = parseInt(String(req.params.id))

      // getCover é acessado via /api/books/:id/cover sem autenticação (para exibição pública)
      // mas filtramos pelo userId se autenticado
      const book = userId
        ? await bookService.findByIdForUser(id, userId).catch(() => bookService.findById(id))
        : await bookService.findById(id)

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
      res.status(err.status ?? 404).json({ error: err.message })
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId
      const id = parseInt(String(req.params.id))
      await bookService.delete(id, userId)
      res.json({ success: true })
    } catch (err: any) {
      res.status(err.status ?? 400).json({ error: err.message })
    }
  }
}

export const bookController = new BookController()
