import type { Request, Response } from 'express';
import { drawingService } from '../services/drawing.service';
import { CreateDrawingSchema, UpdateDrawingSchema, SynthesizeDrawingSchema } from '../schemas/drawing.schema';

export class DrawingController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const result = await drawingService.getAllByUser(req.user!.userId, req.query);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar desenhos.' });
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const drawing = await drawingService.getById(String(req.params.id), req.user!.userId);
      res.json(drawing);
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Desenho não encontrado.' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const validated = CreateDrawingSchema.parse(req.body);
      const drawing = await drawingService.create(req.user!.userId, validated);
      res.status(201).json(drawing);
    } catch (err: any) {
      res.status(400).json({ error: err.errors ? err.errors[0].message : err.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const validated = UpdateDrawingSchema.parse(req.body);
      const drawing = await drawingService.update(String(req.params.id), req.user!.userId, validated);
      res.json(drawing);
    } catch (err: any) {
      res.status(400).json({ error: err.errors ? err.errors[0].message : err.message });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const result = await drawingService.delete(String(req.params.id), req.user!.userId);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Erro ao excluir desenho.' });
    }
  }

  async synthesize(req: Request, res: Response): Promise<void> {
    try {
      const validated = SynthesizeDrawingSchema.parse(req.body);
      const result = await drawingService.synthesize(String(req.params.id), req.user!.userId, validated);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.errors ? err.errors[0].message : err.message });
    }
  }

  async convertToNote(req: Request, res: Response): Promise<void> {
    try {
      const { title, htmlContent, deleteOriginal, folder } = req.body;
      if (!htmlContent) {
        res.status(400).json({ error: 'htmlContent é obrigatório para converter em nota.' });
        return;
      }
      const result = await drawingService.convertToNote(String(req.params.id), req.user!.userId, {
        title,
        htmlContent,
        deleteOriginal: Boolean(deleteOriginal),
        folder,
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}

export const drawingController = new DrawingController();
