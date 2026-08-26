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

export const setThemesSchema = z.object({
  themeIds: z.array(z.coerce.number().int().positive('ID de tema inválido')),
});

export const linkThemeSchema = z.object({
  themeId: z.coerce.number().int().positive('ID de tema inválido'),
});

export const userBookThemeParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número inteiro'),
  themeId: z.string().regex(/^\d+$/, 'ID do tema deve ser um número inteiro'),
});

export type CreateUserBookInput = z.infer<typeof createUserBookSchema>;
export type UpdateUserBookInput = z.infer<typeof updateUserBookSchema>;
export type SetThemesInput = z.infer<typeof setThemesSchema>;
export type LinkThemeInput = z.infer<typeof linkThemeSchema>;

