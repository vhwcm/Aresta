import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  filePath: z.string().min(1, 'Endereço do arquivo (filePath) é obrigatório'),
  coverPath: z.string().optional(),
});

export const adminUploadBookSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  author: z.string().min(1, 'Autor é obrigatório'),
  summary: z.string().optional(),
  fileBase64: z.string().optional(),
  fileName: z.string().optional(),
  filePath: z.string().optional(),
  coverBase64: z.string().optional(),
  coverPath: z.string().optional(),
});

export const bookIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número inteiro'),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type AdminUploadBookInput = z.infer<typeof adminUploadBookSchema>;
