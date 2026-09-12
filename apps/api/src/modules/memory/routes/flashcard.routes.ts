import { Router } from 'express'
import { flashcardController } from '../controllers/flashcard.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const flashcardRouter = Router()

flashcardRouter.use(authenticate)
flashcardRouter.get('/due', (req, res) => flashcardController.getDue(req, res))
flashcardRouter.get('/', (req, res) => flashcardController.list(req, res))
flashcardRouter.post('/', (req, res) => flashcardController.create(req, res))
flashcardRouter.patch('/:id/review', (req, res) => flashcardController.review(req, res))
flashcardRouter.delete('/:id', (req, res) => flashcardController.delete(req, res))
flashcardRouter.delete('/by-annotation/:annotationId', (req, res) => flashcardController.deleteByAnnotation(req, res))
