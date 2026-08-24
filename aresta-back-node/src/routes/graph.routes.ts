import { Router } from 'express';
import { GraphController } from '../controllers/graph.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  createNodeSchema,
  updateNodeSchema,
  nodeIdParamSchema,
  createConnectionSchema,
  connectionParamSchema,
  linkBookSchema,
  unlinkBookParamSchema,
} from '../schemas/graph.schema.js';

const router = Router();
const graphController = new GraphController();

router.use(optionalAuthenticate);

router.get('/', graphController.getGraph);
router.post('/nodes', validateRequest({ body: createNodeSchema }), graphController.createNode);
router.put('/nodes/:id', validateRequest({ params: nodeIdParamSchema, body: updateNodeSchema }), graphController.updateNode);
router.delete('/nodes/:id', validateRequest({ params: nodeIdParamSchema }), graphController.deleteNode);

router.post('/connections', validateRequest({ body: createConnectionSchema }), graphController.createConnection);
router.delete('/connections/:sourceId/:targetId', validateRequest({ params: connectionParamSchema }), graphController.deleteConnection);

router.post('/nodes/:id/books', validateRequest({ params: nodeIdParamSchema, body: linkBookSchema }), graphController.linkBookToNode);
router.delete('/nodes/:id/books/:userBookId', validateRequest({ params: unlinkBookParamSchema }), graphController.unlinkBookFromNode);

export default router;

