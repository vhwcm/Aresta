import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { oauthController } from '../controllers/oauth.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const authRouter = Router()

authRouter.post('/register', (req, res) => authController.register(req, res))
authRouter.post('/login', (req, res) => authController.login(req, res))
authRouter.get('/me', authenticate, (req, res) => authController.me(req, res))
authRouter.delete('/me', authenticate, (req, res) => authController.deleteMe(req, res))

authRouter.get('/oauth/:provider/url', (req, res) => oauthController.getUrl(req, res))
authRouter.post('/oauth/:provider/callback', (req, res) => oauthController.callback(req, res))
authRouter.post('/oauth/:provider/refresh', authenticate, (req, res) => oauthController.refresh(req, res))
authRouter.post('/cloud/:provider/access-token', authenticate, (req, res) => oauthController.getAccessToken(req, res))
authRouter.get('/oauth/:provider/status', authenticate, (req, res) => oauthController.getStatus(req, res))
