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
      if (name.trim().length > 30) {
        res.status(400).json({ error: 'O nome do tema deve ter no máximo 30 caracteres' })
        return
      }
      const node = await graphService.createNode(name, color, description)
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
      const node = await graphService.updateNode(id, name, color, description)
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
      if (err.code === 'P2025') {
        res.status(404).json({ error: 'Tema não encontrado' })
        return
      }
      res.status(500).json({ error: err.message })
    }
  }

  async deleteNode(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10)
      if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: 'ID do nó/tema inválido' })
        return
      }
      await graphService.deleteNode(id)
      res.json({ success: true })
    } catch (err: any) {
      if (err.code === 'P2025') {
        res.status(404).json({ error: 'Tema não encontrado' })
        return
      }
      res.status(500).json({ error: err.message })
    }
  }
}

export const graphController = new GraphController()

