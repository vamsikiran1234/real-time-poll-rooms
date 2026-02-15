import { Router } from 'express';
import { createPoll, getPollById } from '../controllers/pollController';

const router = Router();

router.post('/', createPoll);
router.get('/:id', getPollById);

export default router;
