import { z } from 'zod';

export const CreateDrawingSchema = z.object({
  title: z.string().min(1).max(255).default('Desenho sem título').optional(),
  folder: z.string().nullable().optional(),
  tags: z.union([z.string(), z.array(z.string())]).default('[]').optional(),
  pages_data: z.string().optional(),
  preview_url: z.string().nullable().optional(),
});

export const UpdateDrawingSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  folder: z.string().nullable().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  pages_data: z.string().optional(),
  preview_url: z.string().nullable().optional(),
});

export const SynthesizeDrawingSchema = z.object({
  images: z.array(z.string()).min(1, 'Ao menos uma imagem de página deve ser enviada para síntese'),
  promptOverride: z.string().optional(),
});

export type CreateDrawingInput = z.infer<typeof CreateDrawingSchema>;
export type UpdateDrawingInput = z.infer<typeof UpdateDrawingSchema>;
export type SynthesizeDrawingInput = z.infer<typeof SynthesizeDrawingSchema>;
