import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const app = express();

// Middlewares essenciais
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { env } from './config/env.js';
import { ROUTES } from './config/routes.js';

// Garantir e servir diretórios estáticos
const staticDirs = [
  { route: ROUTES.COVERS, dirPath: env.COVERS_PATH },
  { route: ROUTES.EPUBS, dirPath: env.EPUBS_PATH },
  { route: ROUTES.PDFS, dirPath: env.PDFS_PATH },
];

for (const { route, dirPath } of staticDirs) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  app.use(route, express.static(dirPath));
}

// Rotas da aplicação e Swagger
app.use('/', routes);

// Middleware centralizado de tratamento de erros
app.use(errorHandler);

