import { Router } from 'express'
import { bookController } from '../controllers/book.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const bookRouter = Router()

bookRouter.get('/', authenticate, (req, res) => bookController.list(req, res))
bookRouter.get('/:id', authenticate, (req, res) => bookController.get(req, res))
bookRouter.get('/:id/file', authenticate, (req, res) => bookController.getFile(req, res))
bookRouter.get('/:id/cover', (req, res) => bookController.getCover(req, res))

