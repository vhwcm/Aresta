import { Router } from 'express';
import { UserBookController } from '../controllers/userBook.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  createUserBookSchema,
  updateUserBookSchema,
  userBookIdParamSchema,
  bookIdParamOnlySchema,
} from '../schemas/userBook.schema.js';

const router = Router();
const userBookController = new UserBookController();

router.use(optionalAuthenticate);

router.get('/', userBookController.getUserBooks);
router.post('/', validateRequest({ body: createUserBookSchema }), userBookController.addUserBook);
router.patch('/:id', validateRequest({ params: userBookIdParamSchema, body: updateUserBookSchema }), userBookController.updateUserBook);
router.delete('/:id', validateRequest({ params: userBookIdParamSchema }), userBookController.deleteUserBook);
router.delete('/book/:bookId', validateRequest({ params: bookIdParamOnlySchema }), userBookController.deleteUserBookByBookId);

export default router;

