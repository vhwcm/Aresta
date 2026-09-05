import type { Request, Response } from 'express'
import { canvasService } from '../services/canvas.service'

export class CanvasController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { folder, tag, search } = req.query
      const canvases = await canvasService.getAllByUser(req.user!.userId, {
        folder: folder ? String(folder) : undefined,
        tag: tag ? String(tag) : undefined,
        search: search ? String(search) : undefined,
      })
      res.json(canvases)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async folders(req: Request, res: Response): Promise<void> {
    try {
      const folders = await canvasService.getFolders(req.user!.userId)
      res.json(folders)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const canvas = await canvasService.getById(String(req.params.id), req.user!.userId)
      res.json(canvas)
    } catch (err: any) {
      res.status(404).json({ error: err.message })
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const canvas = await canvasService.create(req.user!.userId, req.body)
      res.status(201).json(canvas)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const canvas = await canvasService.update(String(req.params.id), req.user!.userId, req.body)
      res.json(canvas)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const result = await canvasService.delete(String(req.params.id), req.user!.userId)
      res.json(result)
    } catch (err: any) {
      res.status(404).json({ error: err.message })
    }
  }

  async duplicate(req: Request, res: Response): Promise<void> {
    try {
      const canvas = await canvasService.duplicate(String(req.params.id), req.user!.userId)
      res.status(201).json(canvas)
    } catch (err: any) {
      res.status(404).json({ error: err.message })
    }
  }
}

export const canvasController = new CanvasController()
