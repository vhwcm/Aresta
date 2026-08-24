import { Response, NextFunction } from 'express';
import { ConversionService } from '../services/conversion.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class ConversionController {
  constructor(private conversionService = new ConversionService()) {}

  /**
   * @openapi
   * /api/convert:
   *   post:
   *     summary: Converte um livro ou arquivo PDF para EPUB 3 com análise de layout
   *     tags: [Conversion]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               bookId:
   *                 type: integer
   *                 example: 1
   *               filePath:
   *                 type: string
   *                 example: "storage/books/meu_livro.pdf"
   *               title:
   *                 type: string
   *               author:
   *                 type: string
   *               dpi:
   *                 type: integer
   *                 default: 150
   *     responses:
   *       200:
   *         description: Conversão realizada com sucesso
   *       400:
   *         description: Parâmetros inválidos
   *       502:
   *         description: Falha no serviço de conversão
   */
  convert = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.conversionService.convert(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/convert/health:
   *   get:
   *     summary: Verifica status do microsserviço de conversão
   *     tags: [Conversion]
   *     responses:
   *       200:
   *         description: Status do serviço
   */
  health = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.conversionService.checkHealth();
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };
}
