import { Response, NextFunction } from 'express';
import { GraphService } from '../services/graph.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class GraphController {
  constructor(private graphService = new GraphService()) {}

  private getUserId(req: AuthenticatedRequest): number {
    return req.user?.userId || 1;
  }

  /**
   * @openapi
   * /api/graph:
   *   get:
   *     summary: Obter estrutura unificada do grafo (nós de temas, livros e conexões)
   *     tags: [Graph]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dados do grafo contendo nós de livros/temas e arestas
   */
  getGraph = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const graph = await this.graphService.getUnifiedGraph(userId);
      return res.status(200).json(graph);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/graph/themes/{id}/books:
   *   get:
   *     summary: Listar todos os livros pertencentes a um tema
   *     tags: [Graph]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de livros do tema
   */
  getThemeBooks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const books = await this.graphService.getThemeBooks(id);
      return res.status(200).json(books);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/graph/themes/{id}/annotations:
   *   get:
   *     summary: Listar anotações do usuário vinculadas ao tema
   *     tags: [Graph]
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
   *         description: Lista de anotações vinculadas ao tema
   */
  getThemeAnnotations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const id = parseInt(req.params.id, 10);
      const annotations = await this.graphService.getThemeAnnotations(id, userId);
      return res.status(200).json(annotations);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/graph/nodes:
   *   post:
   *     summary: Criar novo nó (tema global) no grafo
   *     tags: [Graph]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name]
   *             properties:
   *               name:
   *                 type: string
   *               color:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Nó criado
   */
  createNode = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const created = await this.graphService.createTheme(req.body);
      return res.status(201).json(created);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/graph/nodes/{id}:
   *   put:
   *     summary: Atualizar nó (tema) existente
   *     tags: [Graph]
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
   *         description: Nó atualizado
   */
  updateNode = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await this.graphService.updateTheme(id, req.body);
      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/graph/nodes/{id}:
   *   delete:
   *     summary: Remover nó do grafo
   *     tags: [Graph]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       204:
   *         description: Nó removido
   */
  deleteNode = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      await this.graphService.deleteTheme(id);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/graph/connections:
   *   post:
   *     summary: Criar relação hierárquica entre dois temas (subtema)
   *     tags: [Graph]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [sourceId, targetId]
   *             properties:
   *               sourceId:
   *                 type: integer
   *               targetId:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Conexão hierárquica estabelecida
   */
  createConnection = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { sourceId, targetId } = req.body;
      const connection = await this.graphService.createHierarchy(sourceId, targetId);
      return res.status(201).json(connection);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/graph/connections/{sourceId}/{targetId}:
   *   delete:
   *     summary: Remover conexão hierárquica entre dois temas
   *     tags: [Graph]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sourceId
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: targetId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       204:
   *         description: Conexão removida
   */
  deleteConnection = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sourceId = parseInt(req.params.sourceId, 10);
      const targetId = parseInt(req.params.targetId, 10);
      await this.graphService.deleteHierarchy(sourceId, targetId);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/graph/nodes/{id}/books:
   *   post:
   *     summary: Vincular livro a um tema
   *     tags: [Graph]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [bookId]
   *             properties:
   *               bookId:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Livro vinculado com sucesso
   */
  linkBookToNode = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { bookId } = req.body;
      const result = await this.graphService.linkBookToTheme(bookId, id);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/graph/nodes/{id}/books/{bookId}:
   *   delete:
   *     summary: Desvincular livro de um tema
   *     tags: [Graph]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: bookId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       204:
   *         description: Livro desvinculado do tema
   */
  unlinkBookFromNode = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const bookId = parseInt(req.params.bookId, 10);
      await this.graphService.unlinkBookFromTheme(bookId, id);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  };
}
