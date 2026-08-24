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

// Servir arquivos estáticos de capas (/covers)
const coversPath = path.resolve(process.cwd(), 'storage/covers');
if (!fs.existsSync(coversPath)) {
  fs.mkdirSync(coversPath, { recursive: true });
}
app.use('/covers', express.static(coversPath));

// Rotas da aplicação e Swagger
app.use('/', routes);

// Middleware centralizado de tratamento de erros
app.use(errorHandler);

