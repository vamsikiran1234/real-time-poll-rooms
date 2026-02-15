import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { pollService } from '../services/api';
import type { Poll } from '../types/poll';
import { generateFingerprint, getStoredVote, storeVote } from '../utils/fingerprint';
import { 
  connectSocket, 
  disconnectSocket, 
  joinPollRoom, 
  leavePollRoom, 
  onPollUpdate, 
  offPollUpdate 
} from '../services/socketService';
import ConnectionStatus from '../components/ConnectionStatus';
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

  // Socket.io real-time updates
  useEffect(() => {
    if (!pollId) return;

    // Connect to socket and join poll room
    connectSocket();
    joinPollRoom(pollId);

    // Listen for real-time poll updates
    onPollUpdate((updatedPoll: Poll) => {
      console.log('📊 Poll updated in real-time:', updatedPoll);
      setPoll(updatedPoll);
    });

    // Cleanup on unmount
    return () => {
      leavePollRoom(pollId);
      offPollUpdate();
      disconnectSocket();
    };
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await pollService.getPollById(pollId!);
      setPoll(data);
    } catch (err: any) {
      const status = err.response?.status;
      let errorMessage = 'Failed to load poll. Please try again later.';
      
      if (status === 404) {
        errorMessage = '❌ Poll not found. This poll may not exist or has been deleted.';
      } else if (!navigator.onLine) {
        errorMessage = '🌐 No internet connection. Please check your network.';
      } else if (err.response?.data?.error) {
        errorMessage = `⚠️ ${err.response.data.error}`;
      }
      
      setError(errorMessage);
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
      const status = err.response?.status;
      const serverError = err.response?.data?.error;
      
      let errorMessage = 'Failed to submit vote. Please try again.';
      
      if (status === 403) {
        errorMessage = '🚫 You have already voted on this poll. Each person can only vote once.';
      } else if (status === 429) {
        errorMessage = '⏱️ Please wait before voting again. There is a cooldown period between votes.';
      } else if (status === 404) {
        errorMessage = '❌ Poll not found. It may have been deleted.';
      } else if (status === 400) {
        errorMessage = '⚠️ Invalid vote. Please refresh the page and try again.';
      } else if (serverError) {
        errorMessage = `⚠️ ${serverError}`;
      } else if (!navigator.onLine) {
        errorMessage = '🌐 No internet connection. Please check your network and try again.';
      }
      
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
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="poll-view-container">
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={fetchPoll} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="poll-view-container">
        <div className="error-container">
          <div className="error-message">❌ Poll not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="poll-view-container">
      <ConnectionStatus />
      <div className="poll-card">
        <h1 className="poll-question">{poll.question}</h1>

        <div className="poll-stats">
          <div className="total-votes-container">
            <span className="vote-count-number">{poll.totalVotes}</span>
            <span className="vote-count-label">
              {poll.totalVotes === 1 ? 'Vote' : 'Votes'}
            </span>
          </div>
          {votedOptionId && (
            <span className="voted-badge">✓ You voted</span>
          )}
        </div>

        {error && (
          <div className="inline-error-message">
            {error}
            <button 
              onClick={() => setError('')} 
              className="dismiss-error"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <div className="options-list">
          {poll.options.map((option, index) => {
            const percentage = calculatePercentage(option.voteCount);
            const isVoted = votedOptionId === option._id;
            const isLeading = poll.totalVotes > 0 && option.voteCount === Math.max(...poll.options.map(o => o.voteCount));
            
            return (
              <div 
                key={option._id} 
                className={`option-item ${isVoted ? 'voted' : ''} ${votedOptionId ? 'disabled' : ''} ${isLeading && poll.totalVotes > 0 ? 'leading' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="option-header">
                  <span className="option-text">
                    {option.text}
                    {isVoted && <span className="check-mark"> ✓</span>}
                    {isLeading && poll.totalVotes > 0 && !isVoted && (
                      <span className="leading-badge"> 🏆</span>
                    )}
                  </span>
                  <span className="option-stats">
                    <span className="vote-count">{option.voteCount}</span>
                    <span className="percentage">{percentage}%</span>
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${isLeading ? 'leading-fill' : ''}`}
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 10 && (
                      <span className="progress-percentage">{percentage}%</span>
                    )}
                  </div>
                </div>
                {!votedOptionId && (
                  <button
                    onClick={() => handleVote(option._id)}
                    disabled={voting}
                    className="vote-btn"
                  >
                    {voting ? '⏳ Voting...' : '👍 Vote'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="poll-footer">
          <p className="poll-date">
            📅 Created {new Date(poll.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
