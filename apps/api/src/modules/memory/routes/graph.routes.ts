import { Router } from 'express'
import { graphController } from '../controllers/graph.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const graphRouter = Router()

graphRouter.use(authenticate)
graphRouter.get('/', (req, res) => graphController.getGraph(req, res))
graphRouter.get('/themes', (req, res) => graphController.getThemes(req, res))
graphRouter.post('/nodes', (req, res) => graphController.createNode(req, res))
graphRouter.put('/nodes/:id', (req, res) => graphController.updateNode(req, res))
graphRouter.delete('/nodes/:id', (req, res) => graphController.deleteNode(req, res))
graphRouter.post('/nodes/:id/books', (req, res) => graphController.linkBook(req, res))
graphRouter.delete('/nodes/:id/books/:bookId', (req, res) => graphController.unlinkBook(req, res))
graphRouter.post('/connections', (req, res) => graphController.createConnection(req, res))
graphRouter.delete('/connections/:sourceId/:targetId', (req, res) => graphController.deleteConnection(req, res))


