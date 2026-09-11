import { GoogleGenerativeAI } from '@google/generative-ai'

const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || process.env.AI_KEY || ''
const FLASHCARD_API_KEY = process.env.GEMINI_FLASHCARD_API_KEY || process.env.FLASHCARD_AI_KEY || DEFAULT_API_KEY
const DIDACTIC_API_KEY = process.env.GEMINI_DIDACTIC_API_KEY || process.env.DIDACTIC_AI_KEY || DEFAULT_API_KEY

if (!DEFAULT_API_KEY && !FLASHCARD_API_KEY && !DIDACTIC_API_KEY) {
  console.warn('[Gemini Config] Warning: Nenhum GEMINI_API_KEY configurado. Chave dummy será usada em modo offline/desenvolvimento.')
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'
export const GEMINI_FLASHCARD_MODEL = process.env.GEMINI_FLASHCARD_MODEL ?? GEMINI_MODEL
export const GEMINI_DIDACTIC_MODEL = process.env.GEMINI_DIDACTIC_MODEL ?? GEMINI_MODEL
export const GEMINI_EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? 'text-embedding-004'
export const EMBED_DIMENSIONS = 1536

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
