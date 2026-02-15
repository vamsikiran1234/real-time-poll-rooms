import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Poll from '../models/Poll';
import Vote from '../models/Vote';
import { VOTE_COOLDOWN_SECONDS } from '../utils/constants';
import { io } from '../index';

export const submitVote = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const pollId = req.params.id;
    const { optionId, fingerprintToken } = req.body;

    // Input validation
    if (!pollId || typeof pollId !== 'string' || !mongoose.Types.ObjectId.isValid(pollId)) {
      await session.abortTransaction();
      res.status(400).json({ error: 'Invalid poll ID format' });
      return;
    }

    if (!optionId || typeof optionId !== 'string' || !mongoose.Types.ObjectId.isValid(optionId)) {
      await session.abortTransaction();
      res.status(400).json({ error: 'Invalid option ID format' });
      return;
    }

    if (!fingerprintToken || typeof fingerprintToken !== 'string' || fingerprintToken.trim().length === 0) {
      await session.abortTransaction();
      res.status(400).json({ error: 'Fingerprint token is required' });
      return;
    }

    // Sanitize fingerprint token
    const sanitizedToken = fingerprintToken.trim();

    // Find poll
    const poll = await Poll.findById(pollId).session(session);

    if (!poll) {
      await session.abortTransaction();
      res.status(404).json({ error: 'Poll not found' });
      return;
    }

    // Verify option exists
    const optionExists = poll.options.some(
      opt => opt._id.toString() === optionId
    );

    if (!optionExists) {
      await session.abortTransaction();
      res.status(400).json({ error: 'Selected option does not exist in this poll' });
      return;
    }

    // Extract voter IP with fallback
    const voterIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() 
      || req.socket.remoteAddress 
      || 'unknown';

    // Check cooldown period
    const recentVote = await Vote.findOne({ voterIp })
      .sort({ createdAt: -1 })
      .limit(1)
      .session(session);

    if (recentVote) {
      const timeSinceLastVote = (Date.now() - recentVote.createdAt.getTime()) / 1000;
      if (timeSinceLastVote < VOTE_COOLDOWN_SECONDS) {
        await session.abortTransaction();
        const waitTime = Math.ceil(VOTE_COOLDOWN_SECONDS - timeSinceLastVote);
        res.status(429).json({ 
          error: `Please wait ${waitTime} seconds before voting again` 
        });
        return;
      }
    }

    // Check for duplicate vote by IP (within transaction for race condition protection)
    const existingVoteByIp = await Vote.findOne({
      pollId,
      voterIp
    }).session(session);

    if (existingVoteByIp) {
      await session.abortTransaction();
      res.status(403).json({ error: 'You have already voted in this poll' });
      return;
    }

    // Check for duplicate vote by fingerprint
    const existingVoteByFingerprint = await Vote.findOne({
      pollId,
      fingerprintToken: sanitizedToken
    }).session(session);

    if (existingVoteByFingerprint) {
      await session.abortTransaction();
      res.status(403).json({ error: 'You have already voted in this poll' });
      return;
    }

    // Create vote record
    await Vote.create([{
      pollId,
      optionId,
      voterIp,
      fingerprintToken: sanitizedToken
    }], { session });

    // Update poll vote counts atomically
    const updatedPoll = await Poll.findOneAndUpdate(
      { _id: pollId, 'options._id': optionId },
      {
        $inc: {
          'options.$.voteCount': 1,
          totalVotes: 1
        }
      },
      { new: true, session }
    );

    if (!updatedPoll) {
      await session.abortTransaction();
      res.status(500).json({ error: 'Failed to update poll counts' });
      return;
    }

    // Commit transaction
    await session.commitTransaction();

    // Emit socket event after successful transaction
    io.to(`poll:${pollId}`).emit('pollUpdate', updatedPoll);

    res.json({
      message: 'Vote submitted successfully',
      poll: updatedPoll
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Vote submission error:', error);

    // Handle specific MongoDB errors
    if (error.name === 'MongoError' && error.code === 11000) {
      res.status(403).json({ error: 'Duplicate vote detected. You have already voted.' });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Invalid vote data' });
      return;
    }

    res.status(500).json({ error: 'Failed to submit vote. Please try again.' });
  } finally {
    session.endSession();
  }
};
