import type { Request, Response } from 'express'
import { graphService } from '../services/graph.service'

export class GraphController {
  async getGraph(req: Request, res: Response): Promise<void> {
    try {
      const graph = await graphService.getGraph(req.user!.userId)
      res.json(graph)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async getThemes(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const themes = await graphService.getThemes(userId)
      res.json({ themes })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async createNode(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const { name, color, description } = req.body
      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Nome do nó/tema é obrigatório' })
        return
      }
      if (name.trim().length > 30) {
        res.status(400).json({ error: 'O nome do tema deve ter no máximo 30 caracteres' })
        return
      }
      const node = await graphService.createNode(userId, name, color, description)
      res.status(201).json(node)
    } catch (err: any) {
      if (err.message && err.message.includes('30 caracteres')) {
        res.status(400).json({ error: err.message })
        return
      }
      res.status(500).json({ error: err.message })
    }
  }

  async updateNode(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const id = parseInt(String(req.params.id), 10)
      if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: 'ID do nó/tema inválido' })
        return
      }
      const { name, color, description } = req.body
      if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) {
          res.status(400).json({ error: 'Nome do tema não pode ser vazio' })
          return
        }
        if (name.trim().length > 30) {
          res.status(400).json({ error: 'O nome do tema deve ter no máximo 30 caracteres' })
          return
        }
      }
      const node = await graphService.updateNode(userId, id, name, color, description)
      res.json(node)
    } catch (err: any) {
      if (err.message && err.message.includes('30 caracteres')) {
        res.status(400).json({ error: err.message })
        return
      }
      if (err.code === 'P2002') {
        res.status(409).json({ error: 'Já existe um tema com este nome' })
        return
      }
      if (err.code === 'P2025' || (err.message && err.message.includes('não pertence a este usuário'))) {
        res.status(404).json({ error: 'Tema não encontrado' })
        return
      }
      res.status(500).json({ error: err.message })
    }
  }

  async deleteNode(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId ?? (req as any).user?.id
      const id = parseInt(String(req.params.id), 10)
      if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: 'ID do nó/tema inválido' })
        return
      }
      await graphService.deleteNode(userId, id)
      res.json({ success: true })
    } catch (err: any) {
      if (err.code === 'P2025' || (err.message && err.message.includes('não pertence a este usuário'))) {
        res.status(404).json({ error: 'Tema não encontrado' })
        return
      }
      res.status(500).json({ error: err.message })
    }
  }

  async linkBook(req: Request, res: Response): Promise<void> {
    try {
      const themeId = parseInt(String(req.params.id), 10)
      const bookId = parseInt(String(req.body.bookId), 10)
      if (isNaN(themeId) || isNaN(bookId)) {
        res.status(400).json({ error: 'IDs de tema e livro inválidos' })
        return
      }
      const link = await graphService.linkBook(themeId, bookId)
      res.status(201).json(link)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async unlinkBook(req: Request, res: Response): Promise<void> {
    try {
      const themeId = parseInt(String(req.params.id), 10)
      const bookId = parseInt(String(req.params.bookId), 10)
      if (isNaN(themeId) || isNaN(bookId)) {
        res.status(400).json({ error: 'IDs de tema e livro inválidos' })
        return
      }
      await graphService.unlinkBook(themeId, bookId)
      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async createConnection(req: Request, res: Response): Promise<void> {
    try {
      const sourceId = parseInt(String(req.body.sourceId), 10)
      const targetId = parseInt(String(req.body.targetId), 10)
      if (isNaN(sourceId) || isNaN(targetId)) {
        res.status(400).json({ error: 'IDs de origem e destino inválidos' })
        return
      }
      const conn = await graphService.createConnection(sourceId, targetId)
      res.status(201).json(conn)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async deleteConnection(req: Request, res: Response): Promise<void> {
    try {
      const sourceId = parseInt(String(req.params.sourceId), 10)
      const targetId = parseInt(String(req.params.targetId), 10)
      if (isNaN(sourceId) || isNaN(targetId)) {
        res.status(400).json({ error: 'IDs de origem e destino inválidos' })
        return
      }
      await graphService.deleteConnection(sourceId, targetId)
      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }
}

export const graphController = new GraphController()


