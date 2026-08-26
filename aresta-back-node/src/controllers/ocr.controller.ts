import { Response, NextFunction } from 'express';
import { ocrClient } from '../services/ocr.client.js';
import { AuthenticatedRequest } from '../types/index.js';

export class OcrController {
  /**
   * @openapi
   * /api/ocr/transcribe:
   *   post:
   *     summary: Transcrever escrita ou texto a partir de imagem em base64
   *     tags: [OCR]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [imageBase64]
   *             properties:
   *               imageBase64:
   *                 type: string
   *               mimeType:
   *                 type: string
   *                 default: "image/png"
   *               promptHint:
   *                 type: string
   *     responses:
   *       200:
   *         description: Texto transcrito com sucesso
   *       400:
   *         description: Imagem inválida
   *       502:
   *         description: Falha no serviço de OCR
   */
  transcribe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { imageBase64, mimeType = 'image/png', promptHint } = req.body;

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      const imageBuffer = Buffer.from(cleanBase64, 'base64');

      if (!imageBuffer || imageBuffer.length === 0) {
        return res.status(400).json({ error: 'Buffer de imagem inválido ou vazio.' });
      }

      const result = await ocrClient.extractText(imageBuffer, mimeType, promptHint);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Erro no controller de OCR:', error);
      return res.status(502).json({
        error: error.message || 'Falha ao processar transcrição via serviço OCR.',
      });
    }
  };
}
