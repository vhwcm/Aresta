import { Response, NextFunction } from 'express';
import { BookService } from '../services/book.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class BookController {
  constructor(private bookService = new BookService()) {}

  /**
   * @openapi
   * /api/books:
   *   get:
   *     summary: Listar todos os livros disponíveis no acervo
   *     tags: [Books]
   *     responses:
   *       200:
   *         description: Lista de livros
   */
  getAll = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const books = await this.bookService.getAll();
      return res.status(200).json(books);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/books/{id}:
   *   get:
   *     summary: Buscar livro por ID
   *     tags: [Books]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Detalhes do livro
   *       404:
   *         description: Livro não encontrado
   */
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const book = await this.bookService.getById(id);
      return res.status(200).json(book);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/books/{id}/cover:
   *   get:
   *     summary: Obter imagem de capa do livro
   *     tags: [Books]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Arquivo de imagem retornado
   *       404:
   *         description: Capa não encontrada
   */
  getCover = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const coverPath = await this.bookService.getCoverPath(id);
      res.type('image/png');
      return res.sendFile(coverPath);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/books/{id}/file:
   *   get:
   *     summary: Obter arquivo de mídia (EPUB ou PDF) do livro
   *     tags: [Books]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Arquivo do livro retornado
   *       404:
   *         description: Arquivo do livro não encontrado
   */
  getFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const filePath = await this.bookService.getFilePath(id);
      if (filePath.toLowerCase().endsWith('.epub')) {
        res.type('application/epub+zip');
      } else if (filePath.toLowerCase().endsWith('.pdf')) {
        res.type('application/pdf');
      }
      return res.sendFile(filePath);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/books:
   *   post:
   *     summary: Cadastrar novo livro
   *     tags: [Books]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [title, filePath]
   *             properties:
   *               title:
   *                 type: string
   *               filePath:
   *                 type: string
   *               coverPath:
   *                 type: string
   *     responses:
   *       201:
   *         description: Livro cadastrado
   */
  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const book = await this.bookService.create(req.body);
      return res.status(201).json(book);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/books/admin-upload:
   *   post:
   *     summary: Upload administrativo de livro (PDF/EPUB + Título + Autor + IA)
   *     tags: [Books]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [title, author]
   *             properties:
   *               title:
   *                 type: string
   *               author:
   *                 type: string
   *               summary:
   *                 type: string
   *               fileBase64:
   *                 type: string
   *               fileName:
   *                 type: string
   *               coverBase64:
   *                 type: string
   *     responses:
   *       201:
   *         description: Livro cadastrado e enriquecido com sucesso
   */
  adminUpload = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const book = await this.bookService.adminUpload(req.body);
      return res.status(201).json(book);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/books/{id}/enrich:
   *   post:
   *     summary: Reexecuta enriquecimento de IA para o livro
   *     tags: [Books]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Livro enriquecido com sucesso
   */
  enrich = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const book = await this.bookService.enrichBook(id);
      return res.status(200).json(book);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/books/{id}:
   *   delete:
   *     summary: Remover livro do acervo
   *     tags: [Books]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       204:
   *         description: Livro removido
   */
  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      await this.bookService.delete(id);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  };
}
