import { z } from 'zod'

export const GenerateSchema = z.object({
  prompt: z.string().min(1),
  systemInstruction: z.string().optional(),
})

export const EmbedSchema = z.object({
  text: z.string().min(1),
})

export const FlashcardSchema = z.object({
  selectedText: z.string().min(1),
  note: z.string().optional(),
  chapterTitle: z.string().optional(),
  bookTitle: z.string().optional(),
  cardType: z.enum(['CONCEPT_RECALL', 'REAL_SITUATION', 'CONCEPT_UNION']).optional(),
  userLanguage: z.string().optional(),
})

export const TranslateSchema = z.object({
  text: z.string().min(1),
  from: z.string().default('pt-BR'),
  to: z.string().default('en'),
})

export const SummarizeSchema = z.object({
  text: z.string().min(1),
  language: z.string().optional(),
})

export const DidacticExplanationSchema = z.object({
  topic: z.string().min(1),
  themeName: z.string().optional(),
  bookTitle: z.string().optional(),
  flashcardQuestion: z.string().optional(),
  flashcardAnswer: z.string().optional(),
  annotationQuote: z.string().optional(),
  annotationNote: z.string().optional(),
  depthLevel: z.enum(['quick_summary', 'standard', 'deep_dive']).default('standard'),
  userLanguage: z.string().default('pt-BR'),
})

export const ShortExplanationSchema = z.object({
  text: z.string().min(1),
  prompt: z.string().optional(),
  bookTitle: z.string().optional(),
  userLanguage: z.string().default('pt-BR'),
})
