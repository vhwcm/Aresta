import { prisma } from '../config/database'

// SM-2 Algorithm constants
const SM2_MIN_DIFFICULTY = 1.3
const SM2_INITIAL_DIFFICULTY = 2.5

function calculateNextReview(difficulty: number, repetitionLevel: number, rating: 'hard' | 'good' | 'easy') {
  const ratingMap = { hard: 0, good: 3, easy: 5 }
  const q = ratingMap[rating]

  let newDifficulty = difficulty + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  newDifficulty = Math.max(SM2_MIN_DIFFICULTY, newDifficulty)

  let newRepetition = repetitionLevel
  let intervalDays = 1

  if (q >= 3) {
    newRepetition += 1
    if (newRepetition === 1) intervalDays = 1
    else if (newRepetition === 2) intervalDays = 6
    else intervalDays = Math.round(intervalDays * newDifficulty)
  } else {
    newRepetition = 1
    intervalDays = 1
  }

  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays)

  return { newDifficulty, newRepetition, nextReviewAt }
}

export class FlashcardService {
  async getDueCards(userId: number, limit = 20) {
    return prisma.flashcard.findMany({
      where: { user_id: userId, next_review_at: { lte: new Date() } },
      include: { annotation: true },
      orderBy: { next_review_at: 'asc' },
      take: limit,
    })
  }

  async review(flashcardId: number, userId: number, rating: 'hard' | 'good' | 'easy') {
    const card = await prisma.flashcard.findFirst({ where: { id: flashcardId, user_id: userId } })
    if (!card) throw new Error('Flashcard not found')

    const { newDifficulty, newRepetition, nextReviewAt } = calculateNextReview(
      card.difficulty, card.repetition_level, rating
    )

    return prisma.flashcard.update({
      where: { id: flashcardId },
      data: {
        difficulty: newDifficulty,
        repetition_level: newRepetition,
        next_review_at: nextReviewAt,
        last_reviewed_at: new Date(),
        review_count: { increment: 1 },
      },
    })
  }

  async create(data: {
    userId: number
    annotationId: number
    bookId: number
    question: string
    answer: string
    contextSummary?: string
    cardType?: string
  }) {
    return prisma.flashcard.create({
      data: {
        user_id: data.userId,
        annotation_id: data.annotationId,
        book_id: data.bookId,
        question: data.question,
        answer: data.answer,
        context_summary: data.contextSummary,
        card_type: data.cardType ?? 'CONCEPT_RECALL',
        difficulty: SM2_INITIAL_DIFFICULTY,
      },
    })
  }

  async findByUser(userId: number) {
    return prisma.flashcard.findMany({
      where: { user_id: userId },
      include: { annotation: true },
      orderBy: { next_review_at: 'asc' },
    })
  }

  async delete(flashcardId: number, userId: number) {
    return prisma.flashcard.deleteMany({
      where: { id: flashcardId, user_id: userId },
    })
  }

  async deleteByAnnotation(annotationId: number, userId: number) {
    return prisma.flashcard.deleteMany({
      where: { annotation_id: annotationId, user_id: userId },
    })
  }
}

export const flashcardService = new FlashcardService()
