import { z } from 'zod';

export const createAnnotationSchema = z.object({
  bookId: z.number().int().positive('bookId deve ser um número inteiro positivo'),
  cfi: z.string().min(1, 'cfi é obrigatório'),
  selectedText: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  chapterTitle: z.string().optional().nullable(),
  progress: z.number().min(0).max(1).optional().default(0.0),
  themeIds: z.array(z.number().int().positive()).optional().default([]),
});

export const updateAnnotationSchema = z.object({
  cfi: z.string().min(1).optional(),
  selectedText: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  chapterTitle: z.string().optional().nullable(),
  progress: z.number().min(0).max(1).optional(),
  themeIds: z.array(z.number().int().positive()).optional(),
});

export const annotationIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID da anotação deve ser um número inteiro'),
});

export const getAnnotationsQuerySchema = z.object({
  bookId: z.string().regex(/^\d+$/).optional(),
  themeId: z.string().regex(/^\d+$/).optional(),
});

export const linkAnnotationParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID do tema deve ser um número inteiro'),
  annotationId: z.string().regex(/^\d+$/, 'ID da anotação deve ser um número inteiro'),
});

export const createAnnotationWithOcrSchema = z.object({
  bookId: z.number().int().positive('bookId deve ser um número inteiro positivo'),
  cfi: z.string().min(1, 'cfi é obrigatório'),
  selectedText: z.string().optional().nullable(),
  chapterTitle: z.string().optional().nullable(),
  progress: z.number().min(0).max(1).optional().default(0.0),
  themeIds: z.array(z.number().int().positive()).optional().default([]),
  imageBase64: z.string().min(10, 'imageBase64 é obrigatório'),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']).optional().default('image/png'),
  promptHint: z.string().optional(),
});

export type CreateAnnotationInput = z.infer<typeof createAnnotationSchema>;
export type CreateAnnotationWithOcrInput = z.infer<typeof createAnnotationWithOcrSchema>;
export type UpdateAnnotationInput = z.infer<typeof updateAnnotationSchema>;
export type GetAnnotationsQuery = z.infer<typeof getAnnotationsQuerySchema>;


