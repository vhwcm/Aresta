import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const syncController = new SyncController();

router.post('/', authenticate, syncController.sync);

export default router;
