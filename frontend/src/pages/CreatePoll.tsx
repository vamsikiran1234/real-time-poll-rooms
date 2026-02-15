import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollService } from '../services/api';
import './CreatePoll.css';

export default function CreatePoll() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareableLink, setShareableLink] = useState('');
  const [pollId, setPollId] = useState('');

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validateForm = (): string | null => {
    // Validate question
    if (!question || !question.trim()) {
      return '⚠️ Question is required and cannot be empty';
    }

    if (question.trim().length < 5) {
      return '⚠️ Question must be at least 5 characters long';
    }

    if (question.trim().length > 500) {
      return '⚠️ Question is too long (max 500 characters)';
    }

    // Validate options
    const validOptions = options.filter(opt => opt.trim().length > 0);
    
    if (validOptions.length < 2) {
      return '⚠️ At least 2 non-empty options are required';
    }

    if (validOptions.length > 10) {
      return '⚠️ Maximum 10 options allowed';
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      return '⚠️ Duplicate options are not allowed';
    }

    // Check individual option length
    for (const option of validOptions) {
      if (option.trim().length < 1) {
        return '⚠️ Options cannot be empty';
      }
      if (option.trim().length > 200) {
        return '⚠️ Option text is too long (max 200 characters)';
      }
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setShareableLink('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const response = await pollService.createPoll({
        question: question.trim(),
        options: options.filter(opt => opt.trim().length > 0).map(opt => opt.trim())
      });

      setShareableLink(response.shareableLink);
      setPollId(response.pollId);
      setQuestion('');
      setOptions(['', '']);
    } catch (err: any) {
      const status = err.response?.status;
      let errorMessage = '⚠️ Failed to create poll. Please try again.';

      if (!navigator.onLine) {
        errorMessage = '🌐 No internet connection. Please check your network and try again.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = '⏱️ Request timeout. The server took too long to respond. Please try again.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = '🌐 Network error. Unable to reach the server. Please check your connection.';
      } else if (status === 400) {
        errorMessage = `⚠️ ${err.response?.data?.error || 'Invalid poll data'}`;
      } else if (status === 500) {
        errorMessage = '❌ Server error. Please try again later.';
      } else if (err.response?.data?.error) {
        errorMessage = `⚠️ ${err.response.data.error}`;
      } else if (err.message) {
        errorMessage = `⚠️ ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-poll-container">
      <h1>Create a Poll</h1>

      {shareableLink && (
        <div className="success-message">
          <h3>Poll Created Successfully!</h3>
          <p>Share this link:</p>
          <div className="shareable-link">
            <input type="text" value={shareableLink} readOnly />
            <button onClick={() => navigator.clipboard.writeText(shareableLink)}>
              Copy
            </button>
          </div>
          <button 
            onClick={() => navigate(`/poll/${pollId}`)}
            className="view-poll-btn"
          >
            View Poll
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="poll-form">
        <div className="form-group">
          <label htmlFor="question">Question</label>
          <input
            id="question"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to ask?"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Options</label>
          {options.map((option, index) => (
            <div key={index} className="option-input">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                disabled={loading}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="remove-btn"
                  disabled={loading}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="add-option-btn"
            disabled={loading}
          >
            + Add Option
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Creating...' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
}
