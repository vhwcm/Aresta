import { z } from 'zod';

export const createNodeSchema = z.object({
  name: z.string().min(1, 'O nome do tema é obrigatório'),
  color: z.string().default('#E57B55').optional(),
  description: z.string().optional(),
});

export const updateNodeSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
});

export const nodeIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID do nó deve ser um número inteiro'),
});

export const createConnectionSchema = z.object({
  sourceId: z.number().int().positive('sourceId deve ser um número inteiro'),
  targetId: z.number().int().positive('targetId deve ser um número inteiro'),
});

export const connectionParamSchema = z.object({
  sourceId: z.string().regex(/^\d+$/),
  targetId: z.string().regex(/^\d+$/),
});

export const linkBookSchema = z.object({
  bookId: z.number().int().positive('bookId deve ser um número inteiro'),
});

export const unlinkBookParamSchema = z.object({
  id: z.string().regex(/^\d+$/),
  bookId: z.string().regex(/^\d+$/),
});

export const unlinkAnnotationParamSchema = z.object({
  id: z.string().regex(/^\d+$/),
  annotationId: z.string().regex(/^\d+$/),
});

export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;
export type LinkBookInput = z.infer<typeof linkBookSchema>;
