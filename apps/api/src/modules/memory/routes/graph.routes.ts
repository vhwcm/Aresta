import { Router } from 'express'
import { graphController } from '../controllers/graph.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const graphRouter = Router()

graphRouter.use(authenticate)
graphRouter.get('/', (req, res) => graphController.getGraph(req, res))
graphRouter.get('/themes', (req, res) => graphController.getThemes(req, res))
