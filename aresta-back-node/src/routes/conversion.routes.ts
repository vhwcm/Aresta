import { Router } from 'express';
import { ConversionController } from '../controllers/conversion.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { convertBookSchema } from '../schemas/conversion.schema.js';

const router = Router();
const controller = new ConversionController();

router.get('/health', controller.health);
router.post('/', validateRequest({ body: convertBookSchema }), controller.convert);

export default router;
