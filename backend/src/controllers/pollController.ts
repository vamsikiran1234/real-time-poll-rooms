import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Poll from '../models/Poll';

export const createPoll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, options } = req.body;

    // Validate question
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      res.status(400).json({ error: 'Question is required and cannot be empty' });
      return;
    }

    if (question.trim().length < 5) {
      res.status(400).json({ error: 'Question must be at least 5 characters long' });
      return;
    }

    if (question.trim().length > 500) {
      res.status(400).json({ error: 'Question is too long (max 500 characters)' });
      return;
    }

    // Validate options
    if (!Array.isArray(options)) {
      res.status(400).json({ error: 'Options must be an array' });
      return;
    }

    if (options.length > 10) {
      res.status(400).json({ error: 'Maximum 10 options allowed' });
      return;
    }

    const validOptions = options
      .filter(opt => typeof opt === 'string' && opt.trim().length > 0)
      .map(opt => {
        const trimmed = opt.trim();
        if (trimmed.length > 200) {
          throw new Error('Option text is too long (max 200 characters)');
        }
        return {
          text: trimmed,
          voteCount: 0
        };
      });

    if (validOptions.length < 2) {
      res.status(400).json({ error: 'Poll must have at least 2 valid options' });
      return;
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.text.toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      res.status(400).json({ error: 'Duplicate options are not allowed' });
      return;
    }

    const poll = await Poll.create({
      question: question.trim(),
      options: validOptions,
      totalVotes: 0
    });

    const shareableLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/poll/${poll._id}`;

    res.status(201).json({
      pollId: poll._id,
      shareableLink,
      poll
    });
  } catch (error: any) {
    console.error('Poll creation error:', error);
    
    if (error.message && error.message.includes('too long')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    res.status(500).json({ error: 'Failed to create poll' });
  }
};

export const getPollById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      res.status(400).json({ error: 'Poll ID is required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid poll ID format' });
      return;
    }

    const poll = await Poll.findById(id);

    if (!poll) {
      res.status(404).json({ error: 'Poll not found' });
      return;
    }

    res.json(poll);
  } catch (error: any) {
    console.error('Get poll error:', error);

    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid poll ID format' });
      return;
    }

    res.status(500).json({ error: 'Failed to fetch poll' });
  }
};
