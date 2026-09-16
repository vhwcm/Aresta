import { Router } from 'express'
import { userController } from '../controllers/user.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const userRouter = Router()

userRouter.get('/me', authenticate, (req, res) => userController.me(req, res))
userRouter.get('/me/metrics', authenticate, (req, res) => userController.metrics(req, res))
userRouter.patch('/me/profile', authenticate, (req, res) => userController.updateProfile(req, res))
userRouter.patch('/profile', authenticate, (req, res) => userController.updateProfile(req, res))
userRouter.get('/', authenticate, (req, res) => userController.list(req, res))
