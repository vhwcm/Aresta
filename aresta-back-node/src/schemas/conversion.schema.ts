import { z } from 'zod';

export const convertBookSchema = z.object({
  bookId: z.number().int().positive().optional(),
  filePath: z.string().optional(),
  title: z.string().optional(),
  author: z.string().optional(),
  dpi: z.number().int().min(72).max(600).default(150).optional(),
  confidence: z.number().min(0.0).max(1.0).default(0.35).optional(),
  validate: z.boolean().default(true).optional(),
}).refine(data => data.bookId !== undefined || data.filePath !== undefined, {
  message: "É necessário informar 'bookId' ou 'filePath' para a conversão."
});

export type ConvertBookInput = z.infer<typeof convertBookSchema>;
