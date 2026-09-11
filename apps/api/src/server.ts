import express from 'express'
import cors from 'cors'
import path from 'path'
import { env } from './config/env'
import { authenticate } from './middlewares/auth.middleware'

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

// Memory Module
import { annotationRouter } from './modules/memory/routes/annotation.routes'
import { flashcardRouter } from './modules/memory/routes/flashcard.routes'
import { graphRouter } from './modules/memory/routes/graph.routes'
import { didacticRouter } from './modules/memory/routes/didactic.routes'

// AI Module
import { aiRouter } from './modules/ai/routes/ai.routes'
import { aiController } from './modules/ai/controllers/ai.controller'

const app = express()

// Global Middlewares
app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use('/storage', express.static(path.resolve(env.STORAGE_PATH)))

// Unified Healthcheck
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'aresta-api',
    version: '1.0.0',
    port: env.PORT,
    modules: ['auth', 'reader', 'canvas', 'memory', 'ai'],
  })
})

// Auth Routes
app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/users/me', streakRouter)
app.get('/api/user-settings', authenticate, (req, res) => userSettingsController.get(req, res))
app.put('/api/user-settings', authenticate, (req, res) => userSettingsController.upsert(req, res))

// Reader Routes
app.use('/api/books', bookRouter)
app.use('/api/user-books', userBookRouter)
app.use('/api/sync', syncRouter)

// Canvas Routes
app.use('/api/canvas', canvasRouter)
app.use('/api/canvases', canvasRouter)
app.use('/api/notes', noteRouter)

// Memory Routes
app.use('/api/annotations', annotationRouter)
app.use('/api/flashcards', flashcardRouter)
app.use('/api/graph', graphRouter)
app.use('/api/didactic', didacticRouter)

// AI & OCR Routes
app.use('/api/ai', aiRouter)
app.post('/api/ocr/transcribe', (req, res) => aiController.transcribe(req, res))

// Global Error Handler
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
