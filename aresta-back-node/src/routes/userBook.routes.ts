import { Router } from 'express';
import { UserBookController } from '../controllers/userBook.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  createUserBookSchema,
  updateUserBookSchema,
  userBookIdParamSchema,
  bookIdParamOnlySchema,
  setThemesSchema,
  linkThemeSchema,
  userBookThemeParamSchema,
} from '../schemas/userBook.schema.js';

const router = Router();
const userBookController = new UserBookController();

router.use(optionalAuthenticate);

router.get('/', userBookController.getUserBooks);
router.post('/', validateRequest({ body: createUserBookSchema }), userBookController.addUserBook);
router.patch('/:id/access', validateRequest({ params: userBookIdParamSchema }), userBookController.recordAccess);
router.patch('/:id', validateRequest({ params: userBookIdParamSchema, body: updateUserBookSchema }), userBookController.updateUserBook);
router.put('/:id/themes', validateRequest({ params: userBookIdParamSchema, body: setThemesSchema }), userBookController.setThemes);
router.post('/:id/themes', validateRequest({ params: userBookIdParamSchema, body: linkThemeSchema }), userBookController.addTheme);
router.delete('/:id/themes/:themeId', validateRequest({ params: userBookThemeParamSchema }), userBookController.removeTheme);
router.delete('/:id', validateRequest({ params: userBookIdParamSchema }), userBookController.deleteUserBook);
router.delete('/book/:bookId', validateRequest({ params: bookIdParamOnlySchema }), userBookController.deleteUserBookByBookId);

export default router;

