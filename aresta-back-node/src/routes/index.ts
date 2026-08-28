import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger.js';

import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import bookRoutes from './book.routes.js';
import userBookRoutes from './userBook.routes.js';
import userSettingsRoutes from './userSettings.routes.js';
import graphRoutes from './graph.routes.js';
import annotationRoutes from './annotation.routes.js';
import ocrRoutes from './ocr.routes.js';
import streakRoutes from './streak.routes.js';
import healthRoutes from './health.routes.js';
import conversionRoutes from './conversion.routes.js';
import flashcardRoutes from './flashcard.routes.js';

const router = Router();

import { ROUTES } from '../config/routes.js';

// Documentação Swagger UI
router.use(ROUTES.DOCS, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
router.get(ROUTES.DOCS_JSON, (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rotas da API
router.use(ROUTES.AUTH, authRoutes);
router.use(ROUTES.USERS_ME, streakRoutes);
router.use(ROUTES.USERS, userRoutes);
router.use(ROUTES.BOOKS, bookRoutes);
router.use(ROUTES.USER_BOOKS, userBookRoutes);
router.use(ROUTES.USER_SETTINGS, userSettingsRoutes);
router.use(ROUTES.GRAPH, graphRoutes);
router.use(ROUTES.ANNOTATIONS, annotationRoutes);
router.use(ROUTES.OCR, ocrRoutes);
router.use(ROUTES.HEALTH, healthRoutes);
router.use(ROUTES.CONVERT, conversionRoutes);
router.use(ROUTES.FLASHCARDS, flashcardRoutes);
router.use(ROUTES.FLASHCARDS_V1, flashcardRoutes);

export default router;

