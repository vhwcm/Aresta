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

const rawDatabaseUrl = process.env.DATABASE_URL || 'postgresql://aresta:password@localhost:5432/aresta_db'
const sanitizedDatabaseUrl = rawDatabaseUrl.trim().replace(/^[\"']|[\"']$/g, '')

// Validação do JWT_SECRET — falha estrita em produção e fallback seguro em dev/test
const resolveJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production' || process.env.IS_PRODUCTION === 'true') {
      throw new Error(
        '[Aresta] JWT_SECRET não definido ou inseguro em produção (mínimo 32 caracteres). ' +
        'Defina a variável de ambiente JWT_SECRET antes de iniciar o servidor.'
      )
    }
    return secret && secret.length > 0 ? secret : 'aresta-local-dev-jwt-secret-key-min-32chars-ok'
  }
  return secret
}

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  DATABASE_URL: sanitizedDatabaseUrl,
  JWT_SECRET: resolveJwtSecret(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  STORAGE_PATH: path.resolve(process.env.STORAGE_PATH || './storage'),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.AI_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
  GEMINI_EMBED_MODEL: process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001',
  FALLBACK_AI_BASE_URL: process.env.FALLBACK_AI_BASE_URL || '',
  FALLBACK_AI_API_KEY: process.env.FALLBACK_AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || '',
  FALLBACK_AI_MODEL: process.env.FALLBACK_AI_MODEL || 'gpt-4o-mini',
}

// Garantir que process.env seja populado para o Prisma Client e dependências sem aspas
process.env.DATABASE_URL = sanitizedDatabaseUrl

