import { Router } from 'express';
import { AnnotationController } from '../controllers/annotation.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  createAnnotationSchema,
  updateAnnotationSchema,
  annotationIdParamSchema,
  getAnnotationsQuerySchema,
} from '../schemas/annotation.schema.js';

const router = Router();
const annotationController = new AnnotationController();

router.use(optionalAuthenticate);

router.get('/', validateRequest({ query: getAnnotationsQuerySchema }), annotationController.getAnnotations);
router.get('/:id', validateRequest({ params: annotationIdParamSchema }), annotationController.getAnnotationById);
router.post('/', validateRequest({ body: createAnnotationSchema }), annotationController.createAnnotation);
router.put('/:id', validateRequest({ params: annotationIdParamSchema, body: updateAnnotationSchema }), annotationController.updateAnnotation);
router.delete('/:id', validateRequest({ params: annotationIdParamSchema }), annotationController.deleteAnnotation);

export default router;

