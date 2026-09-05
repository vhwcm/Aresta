import { Router } from 'express'
import { userBookController } from '../controllers/userBook.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const userBookRouter = Router()

userBookRouter.use(authenticate)
userBookRouter.get('/', (req, res) => userBookController.list(req, res))
userBookRouter.put('/:bookId', (req, res) => userBookController.upsert(req, res))
