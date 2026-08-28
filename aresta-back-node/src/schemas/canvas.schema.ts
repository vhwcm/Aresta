import { z } from 'zod';

export const createCanvasSchema = z.object({
  title: z.string().min(1, 'O título do quadro é obrigatório').default('Quadro sem título'),
  description: z.string().optional().nullable(),
  data: z.string().optional().default('{"nodes":[],"edges":[],"viewport":{"x":0,"y":0,"zoom":1}}'),
});

export const updateCanvasSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  data: z.string().optional(),
});

export type CreateCanvasInput = z.infer<typeof createCanvasSchema>;
export type UpdateCanvasInput = z.infer<typeof updateCanvasSchema>;
