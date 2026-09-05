import { Router } from 'express'
import { noteController } from '../controllers/note.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const noteRouter = Router()

noteRouter.use(authenticate)
noteRouter.get('/', (req, res) => noteController.list(req, res))
noteRouter.get('/folders', (req, res) => noteController.folders(req, res))
noteRouter.get('/:id', (req, res) => noteController.get(req, res))
noteRouter.post('/', (req, res) => noteController.create(req, res))
noteRouter.put('/:id', (req, res) => noteController.update(req, res))
noteRouter.delete('/:id', (req, res) => noteController.remove(req, res))
