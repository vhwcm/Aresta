import { Router } from 'express';
import { UserSettingsController } from '../controllers/userSettings.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { updateUserSettingsSchema } from '../schemas/userSettings.schema.js';

const router = Router();
const userSettingsController = new UserSettingsController();

router.use(optionalAuthenticate);

router.get('/', userSettingsController.getSettings);
router.put('/', validateRequest({ body: updateUserSettingsSchema }), userSettingsController.updateSettings);

export default router;

