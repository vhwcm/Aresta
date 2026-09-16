import { Router } from 'express'
import { aiController } from '../controllers/ai.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const aiRouter = Router()

// All routes require JWT authentication
aiRouter.post('/generate', authenticate, (req, res) => aiController.generate(req, res))
aiRouter.post('/embed', authenticate, (req, res) => aiController.embed(req, res))
aiRouter.post('/flashcard', authenticate, (req, res) => aiController.flashcard(req, res))
aiRouter.post('/translate', authenticate, (req, res) => aiController.translate(req, res))
aiRouter.post('/summarize', authenticate, (req, res) => aiController.summarize(req, res))
aiRouter.post('/didactic', authenticate, (req, res) => aiController.didactic(req, res))
aiRouter.post('/short-explanation', authenticate, (req, res) => aiController.shortExplanation(req, res))
aiRouter.post('/ocr', authenticate, (req, res) => aiController.synthesize(req, res))

