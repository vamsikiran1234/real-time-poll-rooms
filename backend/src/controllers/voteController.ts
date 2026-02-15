import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Poll from '../models/Poll';
import Vote from '../models/Vote';

export const submitVote = async (req: Request, res: Response): Promise<void> => {
  try {
    const pollId = req.params.id;
    const { optionId, fingerprintToken } = req.body;

    if (!pollId || typeof pollId !== 'string' || !mongoose.Types.ObjectId.isValid(pollId)) {
      res.status(400).json({ error: 'Invalid poll ID' });
      return;
    }

    if (!optionId || !mongoose.Types.ObjectId.isValid(optionId)) {
      res.status(400).json({ error: 'Invalid option ID' });
      return;
    }

    if (!fingerprintToken || typeof fingerprintToken !== 'string') {
      res.status(400).json({ error: 'Fingerprint token is required' });
      return;
    }

    const poll = await Poll.findById(pollId);

    if (!poll) {
      res.status(404).json({ error: 'Poll not found' });
      return;
    }

    const optionExists = poll.options.some(
      opt => opt._id.toString() === optionId
    );

    if (!optionExists) {
      res.status(400).json({ error: 'Invalid option for this poll' });
      return;
    }

    const voterIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() 
      || req.socket.remoteAddress 
      || 'unknown';

    await Vote.create({
      pollId,
      optionId,
      voterIp,
      fingerprintToken
    });

    const updatedPoll = await Poll.findOneAndUpdate(
      { _id: pollId, 'options._id': optionId },
      {
        $inc: {
          'options.$.voteCount': 1,
          totalVotes: 1
        }
      },
      { new: true }
    );

    res.json({
      message: 'Vote submitted successfully',
      poll: updatedPoll
    });
  } catch (error) {
    console.error('Vote submission error:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
};
