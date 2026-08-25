import { z } from 'zod';

export const updateUserSettingsSchema = z.object({
  pageAnimationEnabled: z.boolean().default(true).optional(),
  language: z.string().default('pt-BR').optional(),
  epubFontSize: z.number().int().min(10).max(48).default(18).optional(),
});

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;

