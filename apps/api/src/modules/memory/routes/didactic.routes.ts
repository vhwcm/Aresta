import { Router } from 'express'
import { didacticController } from '../controllers/didactic.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const didacticRouter = Router()

// Todas as rotas de livretos didáticos exigem autenticação
didacticRouter.post('/booklets', authenticate, (req, res) => didacticController.create(req, res))
didacticRouter.post('/booklets/:id/append', authenticate, (req, res) => didacticController.append(req, res))
didacticRouter.get('/booklets', authenticate, (req, res) => didacticController.list(req, res))
didacticRouter.get('/booklets/:id', authenticate, (req, res) => didacticController.getById(req, res))
didacticRouter.delete('/booklets/:id', authenticate, (req, res) => didacticController.delete(req, res))
