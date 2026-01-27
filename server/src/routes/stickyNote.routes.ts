import { Router } from 'express';
import { getNotes, createNote, updateNote, deleteNote } from '../controllers/stickyNote.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getNotes);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
