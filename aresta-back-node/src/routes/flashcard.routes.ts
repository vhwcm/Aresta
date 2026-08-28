import { Router } from 'express';
import { flashcardController } from '../controllers/flashcard.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  reviewFlashcardSchema,
  getDailyDeckQuerySchema,
  generateBatchFlashcardsSchema,
} from '../schemas/flashcard.schema.js';

const router = Router();

router.use(optionalAuthenticate);

router.get('/daily', validateRequest({ query: getDailyDeckQuerySchema }), flashcardController.getDailyDeck);
router.get('/daily/first', validateRequest({ query: getDailyDeckQuerySchema }), flashcardController.getFirstDailyCard);
router.post('/:id/review', validateRequest({ body: reviewFlashcardSchema }), flashcardController.reviewFlashcard);
router.post('/generate-batch', validateRequest({ body: generateBatchFlashcardsSchema }), flashcardController.generateBatch);

export default router;
