import { Router } from 'express'
import { feedbackController } from '../controllers/feedback.controller'
import { authenticate } from '../../../middlewares/auth.middleware'

const router = Router()

router.post('/', authenticate, (req, res) => feedbackController.create(req, res))
router.get('/', authenticate, (req, res) => feedbackController.list(req, res))

export const feedbackRouter = router
