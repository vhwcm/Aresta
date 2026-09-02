import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1, 'O título da nota é obrigatório').max(255).default('Nota sem título'),
  content: z.string().default(''),
  folder: z.string().max(100).optional().nullable(),
  tags: z.array(z.string().max(50)).default([]),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1, 'O título não pode ser vazio').max(255).optional(),
  content: z.string().optional(),
  folder: z.string().max(100).optional().nullable(),
  tags: z.array(z.string().max(50)).optional(),
});

export const noteQuerySchema = z.object({
  folder: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteQueryInput = z.infer<typeof noteQuerySchema>;
