import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { env } from './config/env'
import { authenticate } from './middlewares/auth.middleware'
import { requireAdmin } from './middlewares/admin.middleware'
import { createGoneRouter } from './shared/gone.router'

// Auth Module
import { authRouter } from './modules/auth/routes/auth.routes'
import { userRouter } from './modules/auth/routes/user.routes'

// Reader Module (Public Books Catalog)
import { bookRouter } from './modules/reader/routes/book.routes'

// AI Module
import { aiRouter } from './modules/ai/routes/ai.routes'
import { aiController } from './modules/ai/controllers/ai.controller'

// Feedback Module
import { feedbackRouter } from './modules/feedback/routes/feedback.routes'

const app = express()

// ─── Rate Limiters ───────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15,                   // máximo 15 tentativas por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
})

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minuto
  max: 30,              // máximo 30 requisições por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de requisições AI atingido. Tente novamente em 1 minuto.' },
})

// ─── Allowed Origins ─────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:3000',
      'http://localhost:1420',         // Tauri dev
      'tauri://localhost',             // Tauri production
      'https://tauri.localhost',       // Tauri production (macOS/Linux)
    ]

if (process.env.DOMAIN) {
  allowedOrigins.push(`https://${process.env.DOMAIN}`)
}

// ─── Global Middlewares ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: origem não permitida: ${origin}`))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  })
)
app.options('*', cors())
app.use(express.json({ limit: '20mb' }))
app.use('/storage', express.static(path.resolve(env.STORAGE_PATH)))

// ─── Healthcheck ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', localFirst: true })
})

// ─── Auth Routes (rate-limited) ───────────────────────────────────────────────
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)

// ─── Reader Routes (Public Catalog) ──────────────────────────────────────────
app.use('/api/books', bookRouter)

// ─── Deprecated Personal Routes (410 Gone - Local First Architecture) ────────
app.use('/api/user-settings', createGoneRouter('user-settings'))
app.use('/api/user-books', createGoneRouter('user-books'))
app.use('/api/sync', createGoneRouter('sync'))
app.use('/api/canvas', createGoneRouter('canvas'))
app.use('/api/canvases', createGoneRouter('canvases'))
app.use('/api/notes', createGoneRouter('notes'))
app.use('/api/drawings', createGoneRouter('drawings'))
app.use('/api/annotations', createGoneRouter('annotations'))
app.use('/api/flashcards', createGoneRouter('flashcards'))
app.use('/api/v1/flashcards', createGoneRouter('flashcards'))
app.use('/api/graph', createGoneRouter('graph'))
app.use('/api/didactic', createGoneRouter('didactic'))
app.use('/api/auth/streak', createGoneRouter('streak'))
app.use('/api/auth/metrics', createGoneRouter('metrics'))
app.use('/api/streak', createGoneRouter('streak'))

// ─── AI & OCR Routes (rate-limited + autenticados) ───────────────────────────
app.use('/api/ai', aiLimiter, aiRouter)
app.post('/api/ocr/transcribe', aiLimiter, authenticate, (req, res) => aiController.transcribe(req, res))

// ─── Feedback Routes ──────────────────────────────────────────────────────────
app.use('/api/feedback', feedbackRouter)

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[aresta-api] Unhandled Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`[aresta-api] Monolith API running on http://localhost:${env.PORT}`)
  })
}

export default app
export { requireAdmin }
