import path from 'path'

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://aresta:password@localhost:5432/aresta_db',
  JWT_SECRET: process.env.JWT_SECRET || 'sua-chave-jwt-secreta-compartilhada',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  STORAGE_PATH: path.resolve(process.env.STORAGE_PATH || './storage'),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  GEMINI_EMBED_MODEL: process.env.GEMINI_EMBED_MODEL || 'text-embedding-004',
}
