import { Router } from 'express'
import { userBookController } from '../controllers/userBook.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const userBookRouter = Router()

userBookRouter.use(authenticate)
userBookRouter.get('/', (req, res) => userBookController.list(req, res))
userBookRouter.post('/', (req, res) => userBookController.create(req, res))
userBookRouter.put('/:id/themes', (req, res) => userBookController.setThemes(req, res))
userBookRouter.post('/:id/themes', (req, res) => userBookController.addTheme(req, res))
userBookRouter.delete('/:id/themes/:themeId', (req, res) => userBookController.removeTheme(req, res))
userBookRouter.put('/:bookId', (req, res) => userBookController.upsert(req, res))
userBookRouter.patch('/:id/access', (req, res) => userBookController.recordAccess(req, res))
userBookRouter.patch('/:id', (req, res) => userBookController.update(req, res))
userBookRouter.delete('/:id', (req, res) => userBookController.delete(req, res))

