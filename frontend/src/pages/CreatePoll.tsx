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
    if (!question.trim()) {
      return 'Question is required';
    }

    const validOptions = options.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      return 'At least 2 non-empty options are required';
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
        options: options.filter(opt => opt.trim().length > 0)
      });

      setShareableLink(response.shareableLink);
      setPollId(response.pollId);
      setQuestion('');
      setOptions(['', '']);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create poll');
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
