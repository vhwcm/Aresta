import { z } from 'zod';

export const transcribeOcrSchema = z.object({
  imageBase64: z.string().min(10, 'imageBase64 é obrigatório'),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']).optional().default('image/png'),
  promptHint: z.string().optional(),
});

export type TranscribeOcrInput = z.infer<typeof transcribeOcrSchema>;
