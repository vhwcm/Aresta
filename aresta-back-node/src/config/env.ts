import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 7070,
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'aresta_super_secret_jwt_key_change_in_production',
  DEBUG: process.env.DEBUG === 'true' || process.env.DEBUG === '1' || true,
  STORAGE_PATH: process.env.STORAGE_PATH || path.resolve(process.cwd(), 'storage'),
  PDFS_PATH: process.env.PDFS_PATH || path.resolve(process.cwd(), 'storage/pdfs'),
  EPUBS_PATH: process.env.EPUBS_PATH || path.resolve(process.cwd(), 'storage/epubs'),
  COVERS_PATH: process.env.COVERS_PATH || path.resolve(process.cwd(), 'storage/covers'),
  PDF2EPUB_SERVICE_URL: process.env.PDF2EPUB_SERVICE_URL || 'http://localhost:8000',
};

