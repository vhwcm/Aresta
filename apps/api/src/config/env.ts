import path from 'path'
import fs from 'fs'

try {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(__dirname, '../../../../.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
  ]
  for (const candidate of envCandidates) {
    if (fs.existsSync(candidate) && typeof (process as any).loadEnvFile === 'function') {
      (process as any).loadEnvFile(candidate)
      break
    }
  }
} catch {
  // Ignora erro se .env não existir
}

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://aresta:password@localhost:5432/aresta_db',
  JWT_SECRET: process.env.JWT_SECRET || 'sua-chave-jwt-secreta-compartilhada',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  STORAGE_PATH: path.resolve(process.env.STORAGE_PATH || './storage'),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.AI_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  GEMINI_EMBED_MODEL: process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001',
}
