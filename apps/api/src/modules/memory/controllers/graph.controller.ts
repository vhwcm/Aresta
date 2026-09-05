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
}

export const graphController = new GraphController()
