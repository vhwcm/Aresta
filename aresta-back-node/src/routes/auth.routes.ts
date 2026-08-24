import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const authController = new AuthController();

router.post('/register', validateRequest({ body: registerSchema }), authController.register);
router.post('/login', validateRequest({ body: loginSchema }), authController.login);
router.get('/me', authenticate, authController.me);
router.delete('/me', authenticate, authController.deleteMe);

export default router;

