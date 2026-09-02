import { Router } from 'express';
import { NoteController } from '../controllers/note.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createNoteSchema, updateNoteSchema, noteQuerySchema } from '../schemas/note.schema.js';

const router = Router();
const noteController = new NoteController();

router.use(optionalAuthenticate);

router.get('/', validateRequest({ query: noteQuerySchema }), noteController.getAll);
router.get('/folders', noteController.getFolders);
router.get('/:id', noteController.getById);
router.post('/', validateRequest({ body: createNoteSchema }), noteController.create);
router.put('/:id', validateRequest({ body: updateNoteSchema }), noteController.update);
router.delete('/:id', noteController.delete);

export default router;
