import { Router } from 'express';
import { createPoll, getPollById } from '../controllers/pollController';
import { submitVote } from '../controllers/voteController';

const router = Router();

router.post('/', createPoll);
router.get('/:id', getPollById);
router.post('/:id/vote', submitVote);

export default router;
