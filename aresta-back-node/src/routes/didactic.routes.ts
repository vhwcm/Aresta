import { Router } from 'express';
import { didacticController } from '../controllers/didactic.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  createBookletSchema,
  appendChapterSchema,
  getBookletsQuerySchema,
} from '../schemas/didactic.schema.js';

const router = Router();

router.use(optionalAuthenticate);

router.post('/booklets', validateRequest({ body: createBookletSchema }), didacticController.createBooklet);
router.post('/booklets/:id/append', validateRequest({ body: appendChapterSchema }), didacticController.appendChapter);
router.get('/booklets', validateRequest({ query: getBookletsQuerySchema }), didacticController.getBooklets);
router.get('/booklets/:id', didacticController.getBookletById);

export default router;
