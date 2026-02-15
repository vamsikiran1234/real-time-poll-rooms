import { Request, Response } from 'express';
import Poll from '../models/Poll';

export const createPoll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, options } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    if (!Array.isArray(options)) {
      res.status(400).json({ error: 'Options must be an array' });
      return;
    }

    const validOptions = options
      .filter(opt => typeof opt === 'string' && opt.trim().length > 0)
      .map(opt => ({
        text: opt.trim(),
        voteCount: 0
      }));

    if (validOptions.length < 2) {
      res.status(400).json({ error: 'Poll must have at least 2 valid options' });
      return;
    }

    const poll = await Poll.create({
      question: question.trim(),
      options: validOptions,
      totalVotes: 0
    });

    const shareableLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/poll/${poll._id}`;

    res.status(201).json({
      pollId: poll._id,
      shareableLink,
      poll
    });
  } catch (error) {
    console.error('Poll creation error:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
};

export const getPollById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const poll = await Poll.findById(id);

    if (!poll) {
      res.status(404).json({ error: 'Poll not found' });
      return;
    }

    res.json(poll);
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
};
