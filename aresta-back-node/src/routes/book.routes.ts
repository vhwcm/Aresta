import { Router } from 'express';
import { BookController } from '../controllers/book.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import { createBookSchema, adminUploadBookSchema, bookIdParamSchema } from '../schemas/book.schema.js';

const router = Router();
const bookController = new BookController();

router.get('/', bookController.getAll);
router.get('/:id', validateRequest({ params: bookIdParamSchema }), bookController.getById);
router.get('/:id/cover', validateRequest({ params: bookIdParamSchema }), bookController.getCover);
router.get('/:id/file', validateRequest({ params: bookIdParamSchema }), bookController.getFile);
router.post('/', validateRequest({ body: createBookSchema }), bookController.create);
router.post(
  '/admin-upload',
  authenticate,
  requireRole('ADMIN'),
  validateRequest({ body: adminUploadBookSchema }),
  bookController.adminUpload
);
router.post(
  '/:id/enrich',
  authenticate,
  requireRole('ADMIN'),
  validateRequest({ params: bookIdParamSchema }),
  bookController.enrich
);
router.delete('/:id', authenticate, requireRole('ADMIN'), validateRequest({ params: bookIdParamSchema }), bookController.delete);

export default router;
