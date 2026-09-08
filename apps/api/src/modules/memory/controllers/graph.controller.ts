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

  async getThemes(_req: Request, res: Response): Promise<void> {
    try {
      const themes = await graphService.getThemes()
      res.json({ themes })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async createNode(req: Request, res: Response): Promise<void> {
    try {
      const { name, color, description } = req.body
      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Nome do nó/tema é obrigatório' })
        return
      }
      const node = await graphService.createNode(name, color, description)
      res.status(201).json(node)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async updateNode(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10)
      const { name, color, description } = req.body
      const node = await graphService.updateNode(id, name, color, description)
      res.json(node)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }

  async deleteNode(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10)
      await graphService.deleteNode(id)
      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }
}

export const graphController = new GraphController()

