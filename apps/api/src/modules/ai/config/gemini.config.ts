import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../../../config/env'

const DEFAULT_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.AI_KEY || ''
const FLASHCARD_API_KEY = process.env.GEMINI_FLASHCARD_API_KEY || process.env.FLASHCARD_AI_KEY || DEFAULT_API_KEY
const DIDACTIC_API_KEY = process.env.GEMINI_DIDACTIC_API_KEY || process.env.DIDACTIC_AI_KEY || DEFAULT_API_KEY

if (!DEFAULT_API_KEY && !FLASHCARD_API_KEY && !DIDACTIC_API_KEY) {
  console.warn('[Gemini Config] Warning: Nenhum GEMINI_API_KEY configurado. Chave dummy será usada em modo offline/desenvolvimento.')
}

export const GEMINI_MODEL = env.GEMINI_MODEL || 'gemini-3.7-flash'
export const GEMINI_FLASHCARD_MODEL = process.env.GEMINI_FLASHCARD_MODEL ?? GEMINI_MODEL
export const GEMINI_DIDACTIC_MODEL = process.env.GEMINI_DIDACTIC_MODEL ?? GEMINI_MODEL
export const GEMINI_EMBED_MODEL = env.GEMINI_EMBED_MODEL || 'gemini-embedding-001'
export const EMBED_DIMENSIONS = 1536

// Cascata hierárquica padrão do Gemini: 3.7 -> 3.6 -> 3.5
export const GEMINI_MODEL_CASCADE = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
] as const

// Configuração de provedor fallback externo universal (OpenAI/Groq/OpenRouter compatível)
export const fallbackAiConfig = {
  baseUrl: env.FALLBACK_AI_BASE_URL.replace(/\/+$/, '') || 'https://api.openai.com/v1',
  apiKey: env.FALLBACK_AI_API_KEY,
  model: env.FALLBACK_AI_MODEL || 'gpt-4o-mini',
  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0)
  },
}

// Clients dedicados para cada finalidade de IA
export const genAI = new GoogleGenerativeAI(DEFAULT_API_KEY || 'dummy_key')
export const flashcardAI = new GoogleGenerativeAI(FLASHCARD_API_KEY || DEFAULT_API_KEY || 'dummy_key')
export const didacticAI = new GoogleGenerativeAI(DIDACTIC_API_KEY || DEFAULT_API_KEY || 'dummy_key')

/**
 * Retorna a instância do modelo configurada especificamente para Flashcards
 */
export function getFlashcardModel(systemInstruction?: string) {
  return flashcardAI.getGenerativeModel({
    model: GEMINI_FLASHCARD_MODEL,
    ...(systemInstruction ? { systemInstruction } : {}),
  })
}

/**
 * Retorna a instância do modelo configurada especificamente para Livretos Didáticos e Tutor IA
 */
export function getDidacticModel(systemInstruction?: string) {
  return didacticAI.getGenerativeModel({
    model: GEMINI_DIDACTIC_MODEL,
    ...(systemInstruction ? { systemInstruction } : {}),
  })
}
