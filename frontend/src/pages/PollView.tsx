import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { pollService } from '../services/api';
import type { Poll } from '../types/poll';
import { generateFingerprint, getStoredVote, storeVote } from '../utils/fingerprint';
import './PollView.css';

export default function PollView() {
  const { pollId } = useParams<{ pollId: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (!pollId) {
      setError('Invalid poll ID');
      setLoading(false);
      return;
    }

    const storedVote = getStoredVote(pollId);
    if (storedVote) {
      setVotedOptionId(storedVote);
    }

    fetchPoll();
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await pollService.getPollById(pollId!);
      setPoll(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!pollId || votedOptionId) return;

    try {
      setVoting(true);
      setError('');

      const fingerprint = generateFingerprint();
      const response = await pollService.submitVote(pollId, {
        optionId,
        fingerprintToken: fingerprint
      });

      setPoll(response.poll);
      setVotedOptionId(optionId);
      storeVote(pollId, optionId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to submit vote';
      setError(errorMessage);
    } finally {
      setVoting(false);
    }
  };

  const calculatePercentage = (voteCount: number): number => {
    if (!poll || poll.totalVotes === 0) return 0;
    return Math.round((voteCount / poll.totalVotes) * 100);
  };

  if (loading) {
    return (
      <div className="poll-view-container">
        <div className="loading">Loading poll...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="poll-view-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="poll-view-container">
        <div className="error-message">Poll not found</div>
      </div>
    );
  }

  return (
    <div className="poll-view-container">
      <div className="poll-card">
        <h1 className="poll-question">{poll.question}</h1>

        <div className="poll-stats">
          <span className="total-votes">
            {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
          </span>
          {votedOptionId && (
            <span className="voted-badge">You voted</span>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="options-list">
          {poll.options.map((option) => {
            const percentage = calculatePercentage(option.voteCount);
            const isVoted = votedOptionId === option._id;
            
            return (
              <div 
                key={option._id} 
                className={`option-item ${isVoted ? 'voted' : ''} ${votedOptionId ? 'disabled' : ''}`}
              >
                <div className="option-header">
                  <span className="option-text">
                    {option.text}
                    {isVoted && <span className="check-mark"> ✓</span>}
                  </span>
                  <span className="option-stats">
                    {option.voteCount} ({percentage}%)
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {!votedOptionId && (
                  <button
                    onClick={() => handleVote(option._id)}
                    disabled={voting}
                    className="vote-btn"
                  >
                    {voting ? 'Voting...' : 'Vote'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="poll-footer">
          <p className="poll-date">
            Created {new Date(poll.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
