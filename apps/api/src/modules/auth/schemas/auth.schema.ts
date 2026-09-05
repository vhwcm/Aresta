import { z } from 'zod'

export const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

export const LoginSchema = z.object({
  email: z.string().optional(),
  login: z.string().optional(),
  password: z.string().min(1),
}).refine(data => !!(data.email || data.login), {
  message: 'Email or login identifier is required',
})

export type RegisterDto = z.infer<typeof RegisterSchema>
export type LoginDto = z.infer<typeof LoginSchema>
