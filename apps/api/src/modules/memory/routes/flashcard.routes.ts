import { Router } from 'express'
import { flashcardController } from '../controllers/flashcard.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const flashcardRouter = Router()

flashcardRouter.use(authenticate)
flashcardRouter.get('/due', (req, res) => flashcardController.getDue(req, res))
flashcardRouter.get('/', (req, res) => flashcardController.list(req, res))
flashcardRouter.patch('/:id/review', (req, res) => flashcardController.review(req, res))
