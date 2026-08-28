import { Router } from 'express';
import { CanvasController } from '../controllers/canvas.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createCanvasSchema, updateCanvasSchema } from '../schemas/canvas.schema.js';

const router = Router();
const canvasController = new CanvasController();

router.use(optionalAuthenticate);

router.get('/', canvasController.getAll);
router.get('/:id', canvasController.getById);
router.post('/', validateRequest({ body: createCanvasSchema }), canvasController.create);
router.put('/:id', validateRequest({ body: updateCanvasSchema }), canvasController.update);
router.delete('/:id', canvasController.delete);
router.post('/:id/duplicate', canvasController.duplicate);

export default router;
