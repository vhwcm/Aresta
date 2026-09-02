import { z } from 'zod';

export const createBookletSchema = z.object({
  title: z.string().min(2, 'O título deve ter pelo menos 2 caracteres').max(200),
  topic: z.string().min(3, 'O tópico deve ter pelo menos 3 caracteres').max(300),
  theme_id: z.number().int().positive().optional(),
  flashcard_id: z.number().int().positive().optional(),
  annotation_id: z.number().int().positive().optional(),
  depth_level: z.enum(['quick_summary', 'standard', 'deep_dive']).default('standard'),
  custom_prompt: z.string().max(1000).optional(),
});

export const appendChapterSchema = z.object({
  title: z.string().min(2, 'O título do capítulo deve ter pelo menos 2 caracteres').max(200).optional(),
  topic: z.string().min(3, 'O tópico do capítulo deve ter pelo menos 3 caracteres').max(300),
  theme_id: z.number().int().positive().optional(),
  flashcard_id: z.number().int().positive().optional(),
  annotation_id: z.number().int().positive().optional(),
  depth_level: z.enum(['quick_summary', 'standard', 'deep_dive']).default('standard'),
  custom_prompt: z.string().max(1000).optional(),
});

export const getBookletsQuerySchema = z.object({
  theme_id: z.coerce.number().int().positive().optional(),
});

export type CreateBookletInput = z.infer<typeof createBookletSchema>;
export type AppendChapterInput = z.infer<typeof appendChapterSchema>;
export type GetBookletsQuery = z.infer<typeof getBookletsQuerySchema>;
