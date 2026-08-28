import { z } from 'zod';

export const reviewFlashcardSchema = z.object({
  rating: z.enum(['hard', 'good', 'easy']),
});

export const getDailyDeckQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data deve estar no formato YYYY-MM-DD' }).optional(),
});

export const generateBatchFlashcardsSchema = z.object({
  limit: z.number().int().positive().optional(),
});

export type ReviewFlashcardInput = z.infer<typeof reviewFlashcardSchema>;
export type GetDailyDeckQuery = z.infer<typeof getDailyDeckQuerySchema>;
export type GenerateBatchFlashcardsInput = z.infer<typeof generateBatchFlashcardsSchema>;
