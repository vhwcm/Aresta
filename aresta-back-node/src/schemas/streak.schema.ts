import { z } from 'zod';

export const recordReadingTimeSchema = z.object({
  reading_seconds: z.number().int().min(1, 'Os segundos de leitura devem ser maiores que 0').max(300, 'Teto máximo de 300 segundos (5 minutos) por registro de página excedido')
});

export const recordFlashcardReviewSchema = z.object({
  count: z.number().int().min(1, 'A contagem deve ser no mínimo 1').max(50, 'Máximo de 50 revisões por lote').optional().default(1)
});

export const updateStreakTargetSchema = z.object({
  target_days: z.number().int().min(1, 'A meta deve ser de pelo menos 1 dia').max(1000, 'Meta máxima de 1000 dias')
});

export type RecordReadingTimeInput = z.infer<typeof recordReadingTimeSchema>;
export type RecordFlashcardReviewInput = z.infer<typeof recordFlashcardReviewSchema>;
export type UpdateStreakTargetInput = z.infer<typeof updateStreakTargetSchema>;
