import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  filePath: z.string().min(1, 'Endereço do arquivo (filePath) é obrigatório'),
  coverPath: z.string().optional(),
});

export const bookIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número inteiro'),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;

