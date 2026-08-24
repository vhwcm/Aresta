import { z } from 'zod';

export const createUserBookSchema = z.object({
  bookId: z.number().int().positive('ID do livro inválido'),
  status: z.enum(['QUERO_LER', 'LENDO', 'LIDO', 'ABANDONADO']).default('QUERO_LER').optional(),
  currentPage: z.number().int().min(0).default(0).optional(),
  lastAccessedAt: z.coerce.date().optional(),
});

export const updateUserBookSchema = z.object({
  status: z.enum(['QUERO_LER', 'LENDO', 'LIDO', 'ABANDONADO']).optional(),
  currentPage: z.number().int().min(0).optional(),
  lastAccessedAt: z.coerce.date().optional(),
});

export const userBookIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número inteiro'),
});

export const bookIdParamOnlySchema = z.object({
  bookId: z.string().regex(/^\d+$/, 'ID do livro deve ser um número inteiro'),
});

export type CreateUserBookInput = z.infer<typeof createUserBookSchema>;
export type UpdateUserBookInput = z.infer<typeof updateUserBookSchema>;

