import type { Request, Response } from 'express'
import { userBookService } from '../services/userBook.service'

export class UserBookController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const records = await userBookService.findByUser(userId)
      const books = records.map((ub) => ({
        id: ub.id,
        userBookId: ub.id,
        bookId: ub.book_id,
        title: ub.book?.title || 'Sem título',
        author: ub.book?.publicInfo?.author || 'Autor Desconhecido',
        summary: ub.book?.publicInfo?.summary || null,
        filePath: ub.book?.file_path || '',
        coverPath: ub.book?.cover_path || null,
        status: ub.status,
        currentPage: ub.current_page,
        lastAccessedAt: ub.last_accessed_at,
        themes: ub.book?.bookThemes?.map((bt) => ({
          id: bt.theme.id,
          name: bt.theme.name,
          color: bt.theme.color,
          description: bt.theme.description,
        })) || [],
      }))
      res.json(books)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const { bookId, title, author, summary, coverPath, filePath, fileType, status, currentPage } = req.body

      if (title) {
        const sanitizedTitle = String(title).trim().slice(0, 30)
        const userBook = await userBookService.registerUploadedBook(userId, {
          title: sanitizedTitle,
          author,
          summary,
          coverPath,
          filePath,
          fileType,
          status,
          currentPage,
        })
        res.status(201).json({ userBook })
        return
      }

      const userBook = await userBookService.upsert(userId, Number(bookId), { status, currentPage })
      res.status(201).json({ userBook })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async upsert(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const bookId = parseInt(String(req.params.bookId))
      const userBook = await userBookService.upsert(userId, bookId, req.body)
      res.json({ userBook })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const id = parseInt(String(req.params.id))
      await userBookService.update(userId, id, req.body)
      res.json({ success: true })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const id = parseInt(String(req.params.id))
      await userBookService.delete(userId, id)
      res.json({ success: true })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async recordAccess(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const id = parseInt(String(req.params.id))
      await userBookService.recordAccess(userId, id)
      res.json({ success: true })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async setThemes(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const id = parseInt(String(req.params.id))
      const { themeIds } = req.body
      const userBook = await userBookService.setThemes(userId, id, themeIds || [])
      res.json({ success: true, userBook })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async addTheme(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const id = parseInt(String(req.params.id))
      const { themeId } = req.body
      const userBook = await userBookService.addTheme(userId, id, Number(themeId))
      res.json({ success: true, userBook })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async removeTheme(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const id = parseInt(String(req.params.id))
      const themeId = parseInt(String(req.params.themeId))
      const userBook = await userBookService.removeTheme(userId, id, themeId)
      res.json({ success: true, userBook })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }
}

export const userBookController = new UserBookController()

