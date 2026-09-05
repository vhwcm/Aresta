import { Router } from 'express'
import { streakController } from '../controllers/streak.controller'
import { userSettingsController } from '../controllers/userSettings.controller'
import { authenticate } from '../middlewares/jwt.middleware'

export const streakRouter = Router()

streakRouter.use(authenticate)
streakRouter.get('/streak', (req, res) => streakController.getStreak(req, res))
streakRouter.post('/activity/reading-time', (req, res) => streakController.recordReadingTime(req, res))
streakRouter.post('/activity/flashcard-review', (req, res) => streakController.recordFlashcardReview(req, res))
streakRouter.patch('/streak/target', (req, res) => streakController.updateStreakTarget(req, res))
streakRouter.get('/settings', (req, res) => userSettingsController.get(req, res))
streakRouter.put('/settings', (req, res) => userSettingsController.upsert(req, res))
