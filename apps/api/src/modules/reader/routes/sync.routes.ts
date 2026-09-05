import { Router } from 'express'
import { syncController } from '../controllers/sync.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const syncRouter = Router()

syncRouter.post('/', authenticate, (req, res) => syncController.sync(req, res))
