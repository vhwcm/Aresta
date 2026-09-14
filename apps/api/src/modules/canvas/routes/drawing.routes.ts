import { Router } from 'express';
import { drawingController } from '../controllers/drawing.controller';
import { authenticate } from '../middlewares/jwt.middleware';

export const drawingRouter = Router();

drawingRouter.use(authenticate);

drawingRouter.get('/', (req, res) => drawingController.list(req, res));
drawingRouter.get('/:id', (req, res) => drawingController.get(req, res));
drawingRouter.post('/', (req, res) => drawingController.create(req, res));
drawingRouter.put('/:id', (req, res) => drawingController.update(req, res));
drawingRouter.delete('/:id', (req, res) => drawingController.remove(req, res));
drawingRouter.post('/:id/synthesize', (req, res) => drawingController.synthesize(req, res));
drawingRouter.post('/:id/convert-to-note', (req, res) => drawingController.convertToNote(req, res));
