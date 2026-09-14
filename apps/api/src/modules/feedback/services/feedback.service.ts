import { prisma } from '../../../config/prisma'

export interface CreateFeedbackDTO {
  userId: number
  message: string
  type?: string
}

export class FeedbackService {
  async create(data: CreateFeedbackDTO) {
    if (!data.message || !data.message.trim()) {
      throw new Error('A mensagem não pode estar vazia')
    }

    const validTypes = ['FEEDBACK', 'IMPROVEMENT', 'BUG']
    const type = data.type && validTypes.includes(data.type.toUpperCase())
      ? data.type.toUpperCase()
      : 'FEEDBACK'

    return prisma.feedback.create({
      data: {
        user_id: data.userId,
        message: data.message.trim(),
        type,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  async list(limit = 50, offset = 0) {
    return prisma.feedback.findMany({
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }
}

export const feedbackService = new FeedbackService()
