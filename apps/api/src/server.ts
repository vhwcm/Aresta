import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { env } from './config/env'
import { authenticate } from './middlewares/auth.middleware'
import { requireAdmin } from './middlewares/admin.middleware'

// Auth Module
import { authRouter } from './modules/auth/routes/auth.routes'
import { userRouter } from './modules/auth/routes/user.routes'
import { streakRouter } from './modules/auth/routes/streak.routes'
import { userSettingsController } from './modules/auth/controllers/userSettings.controller'

// Reader Module
import { bookRouter } from './modules/reader/routes/book.routes'
import { userBookRouter } from './modules/reader/routes/userBook.routes'
import { syncRouter } from './modules/reader/routes/sync.routes'

// Canvas Module
import { canvasRouter } from './modules/canvas/routes/canvas.routes'
import { noteRouter } from './modules/canvas/routes/note.routes'
import { drawingRouter } from './modules/canvas/routes/drawing.routes'

// Memory Module
import { annotationRouter } from './modules/memory/routes/annotation.routes'
import { flashcardRouter } from './modules/memory/routes/flashcard.routes'
import { graphRouter } from './modules/memory/routes/graph.routes'
import { didacticRouter } from './modules/memory/routes/didactic.routes'

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
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite servir arquivos estáticos cross-origin
}))

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requests sem origin (ex: Tauri, Postman em dev, mobile apps)
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

// ─── Healthcheck (sem dados internos expostos) ────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// ─── Auth Routes (rate-limited) ───────────────────────────────────────────────
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/users/me', streakRouter)
app.get('/api/user-settings', authenticate, (req, res) => userSettingsController.get(req, res))
app.put('/api/user-settings', authenticate, (req, res) => userSettingsController.upsert(req, res))

// ─── Reader Routes ────────────────────────────────────────────────────────────
app.use('/api/books', bookRouter)
app.use('/api/user-books', userBookRouter)
app.use('/api/sync', syncRouter)

// ─── Canvas Routes ────────────────────────────────────────────────────────────
app.use('/api/canvas', canvasRouter)
app.use('/api/canvases', canvasRouter)
app.use('/api/notes', noteRouter)
app.use('/api/drawings', drawingRouter)

// ─── Memory Routes ────────────────────────────────────────────────────────────
app.use('/api/annotations', annotationRouter)
app.use('/api/flashcards', flashcardRouter)
app.use('/api/v1/flashcards', flashcardRouter)
app.use('/api/graph', graphRouter)
app.use('/api/didactic', didacticRouter)

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
