import { z } from 'zod';

export const updateUserSettingsSchema = z.object({
  pageAnimationEnabled: z.boolean().default(true).optional(),
  language: z.string().default('pt-BR').optional(),
});

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;

