import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const authRouter = Router()

authRouter.post('/register', (req, res) => authController.register(req, res))
authRouter.post('/login', (req, res) => authController.login(req, res))
authRouter.get('/me', authenticate, (req, res) => authController.me(req, res))
