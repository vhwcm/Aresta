import { z } from 'zod'

export const createBookletSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200).optional(),
  topic: z.string().min(3, 'Tópico deve ter no mínimo 3 caracteres').max(500),
  theme_id: z.number().int().positive().optional().nullable(),
  flashcard_id: z.number().int().positive().optional().nullable(),
  annotation_id: z.number().int().positive().optional().nullable(),
  target_audience: z.string().default('student'),
  depth_level: z.enum(['quick_summary', 'standard', 'deep_dive']).default('standard'),
})

export type CreateBookletInput = z.infer<typeof createBookletSchema>

export const appendChapterSchema = z.object({
  topic: z.string().min(3, 'Tópico deve ter no mínimo 3 caracteres').max(500),
  title: z.string().min(1).max(200).optional(),
  flashcard_id: z.number().int().positive().optional().nullable(),
  annotation_id: z.number().int().positive().optional().nullable(),
  depth_level: z.enum(['quick_summary', 'standard', 'deep_dive']).default('standard'),
})

export type AppendChapterInput = z.infer<typeof appendChapterSchema>

export const getBookletsQuerySchema = z.object({
  theme_id: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export type GetBookletsQueryInput = z.infer<typeof getBookletsQuerySchema>
