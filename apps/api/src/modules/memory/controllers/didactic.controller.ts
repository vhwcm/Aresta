import type { Request, Response } from 'express'
import { didacticBookletService } from '../services/didacticBooklet.service'
import { createBookletSchema, appendChapterSchema, getBookletsQuerySchema } from '../schemas/didactic.schema'

export class DidacticController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const input = createBookletSchema.parse(req.body)
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
      const booklet = await didacticBookletService.createBooklet(req.user!.userId, input, token)
      res.status(201).json({
        success: true,
        booklet,
        book: {
          id: booklet.book_id,
          title: booklet.title,
          format_type: 'DIDACTIC',
          is_ai_generated: true,
        },
      })
    } catch (err: any) {
      const status = err.statusCode || (err.name === 'ZodError' ? 400 : 500)
      res.status(status).json({ error: err.message, code: err.code })
    }
  }

  async append(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10)
      const input = appendChapterSchema.parse(req.body)
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
      const result = await didacticBookletService.appendChapter(req.user!.userId, id, input, token)
      res.json({
        success: true,
        ...result,
      })
    } catch (err: any) {
      const status = err.statusCode || (err.name === 'ZodError' ? 400 : 500)
      res.status(status).json({ error: err.message, code: err.code })
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const query = getBookletsQuerySchema.parse(req.query)
      const result = await didacticBookletService.getBooklets(req.user!.userId, query)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10)
      const booklet = await didacticBookletService.getBookletById(req.user!.userId, id)
      res.json({ booklet })
    } catch (err: any) {
      const status = err.statusCode || 500
      res.status(status).json({ error: err.message })
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10)
      const result = await didacticBookletService.deleteBooklet(req.user!.userId, id)
      res.json(result)
    } catch (err: any) {
      const status = err.statusCode || 500
      res.status(status).json({ error: err.message })
    }
  }
}

export const didacticController = new DidacticController()
