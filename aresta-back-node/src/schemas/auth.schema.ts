import { z } from 'zod';

export const loginSchema = z.object({
  login: z.string().min(1, 'Login ou e-mail é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type LoginInput = z.infer<typeof loginSchema>;

