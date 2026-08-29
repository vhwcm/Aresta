import { z } from 'zod';

export const updateUserSettingsSchema = z.object({
  pageAnimationEnabled: z.boolean().default(true).optional(),
  language: z.string().default('pt-BR').optional(),
  nativeLanguage: z.enum(['pt-BR', 'pt', 'en', 'es']).default('pt-BR').optional(),
  targetTranslationLanguage: z.enum(['pt-BR', 'pt', 'en', 'es']).default('en').optional(),
  epubFontSize: z.number().int().min(10).max(48).default(18).optional(),
  epubFontFamily: z.enum(['newsreader', 'literata', 'lora', 'merriweather', 'inter']).default('newsreader').optional(),
  themeMode: z.enum(['dark', 'light', 'sepia']).default('dark').optional(),
  desktopHomeGraphOpen: z.boolean().default(true).optional(),
  desktopReaderGraphOpen: z.boolean().default(false).optional(),
});

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;


