import { Router } from 'express'
import { annotationController } from '../controllers/annotation.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const annotationRouter = Router()

annotationRouter.use(authenticate)
annotationRouter.post('/', (req, res) => annotationController.create(req, res))
annotationRouter.get('/', (req, res) => annotationController.listByUser(req, res))
annotationRouter.get('/book/:bookId', (req, res) => annotationController.listByBook(req, res))
annotationRouter.get('/:id/similar', (req, res) => annotationController.similar(req, res))
annotationRouter.delete('/:id', (req, res) => annotationController.remove(req, res))
