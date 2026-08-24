import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'USER']).default('USER').optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('E-mail inválido').optional(),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  isActive: z.boolean().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número inteiro'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

