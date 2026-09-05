import { Router } from 'express'
import { canvasController } from '../controllers/canvas.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const canvasRouter = Router()

canvasRouter.use(authenticate)
canvasRouter.get('/folders', (req, res) => canvasController.folders(req, res))
canvasRouter.get('/', (req, res) => canvasController.list(req, res))
canvasRouter.get('/:id', (req, res) => canvasController.get(req, res))
canvasRouter.post('/', (req, res) => canvasController.create(req, res))
canvasRouter.put('/:id', (req, res) => canvasController.update(req, res))
canvasRouter.delete('/:id', (req, res) => canvasController.remove(req, res))
canvasRouter.post('/:id/duplicate', (req, res) => canvasController.duplicate(req, res))
