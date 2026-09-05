import type { Request, Response } from 'express'
import { aiService } from '../services/ai.service'
import { GenerateSchema, EmbedSchema, FlashcardSchema, TranslateSchema, SummarizeSchema, DidacticExplanationSchema } from '../schemas/ai.schema'

export class AiController {
  async generate(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, systemInstruction } = GenerateSchema.parse(req.body)
      const text = await aiService.generate(prompt, systemInstruction)
      res.json({ text })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async embed(req: Request, res: Response): Promise<void> {
    try {
      const { text } = EmbedSchema.parse(req.body)
      const embedding = await aiService.embed(text)
      res.json({ embedding, dimensions: embedding.length })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async flashcard(req: Request, res: Response): Promise<void> {
    try {
      const params = FlashcardSchema.parse(req.body)
      const result = await aiService.generateFlashcard(params)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async translate(req: Request, res: Response): Promise<void> {
    try {
      const { text, from, to } = TranslateSchema.parse(req.body)
      const translated = await aiService.translate(text, from, to)
      res.json({ translated })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async summarize(req: Request, res: Response): Promise<void> {
    try {
      const { text, language } = SummarizeSchema.parse(req.body)
      const summary = await aiService.summarize(text, language)
      res.json({ summary })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async didactic(req: Request, res: Response): Promise<void> {
    try {
      const params = DidacticExplanationSchema.parse(req.body)
      const explanation = await aiService.generateDidacticExplanation(params)
      res.json(explanation)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }
}

export const aiController = new AiController()
