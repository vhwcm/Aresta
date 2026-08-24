import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema, userIdParamSchema } from '../schemas/user.schema.js';

const router = Router();
const userController = new UserController();

// Proteção global para rotas de gerenciamento de usuários (Apenas ADMIN)
router.use(authenticate, requireRole('ADMIN'));

router.get('/', userController.getAll);
router.get('/:id', validateRequest({ params: userIdParamSchema }), userController.getById);
router.post('/', validateRequest({ body: createUserSchema }), userController.create);
router.put('/:id', validateRequest({ params: userIdParamSchema, body: updateUserSchema }), userController.update);
router.delete('/:id', validateRequest({ params: userIdParamSchema }), userController.delete);

export default router;

