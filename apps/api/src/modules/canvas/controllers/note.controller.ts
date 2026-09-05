import type { Request, Response } from 'express'
import { noteService } from '../services/note.service'

export class NoteController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const result = await noteService.getAllByUser(req.user!.userId, req.query)
      res.json(result)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const note = await noteService.getById(String(req.params.id), req.user!.userId)
      res.json(note)
    } catch (err: any) {
      res.status(404).json({ error: err.message })
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const note = await noteService.create(req.user!.userId, req.body)
      res.status(201).json(note)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const note = await noteService.update(String(req.params.id), req.user!.userId, req.body)
      res.json(note)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const result = await noteService.delete(String(req.params.id), req.user!.userId)
      res.json(result)
    } catch (err: any) {
      res.status(404).json({ error: err.message })
    }
  }

  async folders(req: Request, res: Response): Promise<void> {
    try {
      const folders = await noteService.getFolders(req.user!.userId)
      res.json(folders)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }
}

export const noteController = new NoteController()
