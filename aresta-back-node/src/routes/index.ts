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
import healthRoutes from './health.routes.js';
import conversionRoutes from './conversion.routes.js';

const router = Router();

// Documentação Swagger UI
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
router.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rotas da API
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/books', bookRoutes);
router.use('/api/user-books', userBookRoutes);
router.use('/api/user-settings', userSettingsRoutes);
router.use('/api/graph', graphRoutes);
router.use('/api/annotations', annotationRoutes);
router.use('/api/health', healthRoutes);
router.use('/api/convert', conversionRoutes);

export default router;

