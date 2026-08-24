import { Router } from 'express';
import { StreakController } from '../controllers/streak.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  recordReadingTimeSchema,
  recordFlashcardReviewSchema,
  updateStreakTargetSchema
} from '../schemas/streak.schema.js';

const router = Router();
const streakController = new StreakController();

router.use(optionalAuthenticate);

// Obter status da ofensiva e progresso do dia
router.get('/streak', streakController.getStreak);

// Registrar pulso de tempo de leitura
router.post(
  '/activity/reading-time',
  validateRequest({ body: recordReadingTimeSchema }),
  streakController.recordReadingTime
);

// Registrar revisão de flashcard
router.post(
  '/activity/flashcard-review',
  validateRequest({ body: recordFlashcardReviewSchema }),
  streakController.recordFlashcardReview
);

// Atualizar meta de dias da ofensiva
router.patch(
  '/streak/target',
  validateRequest({ body: updateStreakTargetSchema }),
  streakController.updateStreakTarget
);

export default router;
