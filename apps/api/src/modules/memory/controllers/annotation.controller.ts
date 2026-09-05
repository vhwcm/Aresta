import type { Request, Response } from 'express'
import { annotationService } from '../services/annotation.service'

export class AnnotationController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') ?? ''
      const annotation = await annotationService.create({ ...req.body, userId: req.user!.userId, token })
      res.status(201).json({ annotation })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async listByBook(req: Request, res: Response): Promise<void> {
    try {
      const bookId = parseInt(String(req.params.bookId))
      const annotations = await annotationService.findByBook(req.user!.userId, bookId)
      res.json({ annotations })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async listByUser(req: Request, res: Response): Promise<void> {
    try {
      const annotations = await annotationService.findByUser(req.user!.userId)
      res.json({ annotations })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async similar(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id))
      const results = await annotationService.findSimilar(id, req.user!.userId)
      res.json({ results })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      await annotationService.delete(parseInt(String(req.params.id)), req.user!.userId)
      res.status(204).send()
    } catch (err: any) {
      res.status(404).json({ error: err.message })
    }
  }
}

export const annotationController = new AnnotationController()
