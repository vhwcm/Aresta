import { Router } from 'express';
import { OcrController } from '../controllers/ocr.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { transcribeOcrSchema } from '../schemas/ocr.schema.js';

const router = Router();
const ocrController = new OcrController();

router.use(optionalAuthenticate);

router.post('/transcribe', validateRequest({ body: transcribeOcrSchema }), ocrController.transcribe);

export default router;
