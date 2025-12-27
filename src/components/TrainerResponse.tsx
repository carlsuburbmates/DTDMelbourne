/**
 * TrainerResponse component for Dog Trainers Directory
 * Displays and handles trainer responses to reviews
 */

'use client';

import React, { useState, useEffect } from 'react';
import { TrainerResponse as TrainerResponseType } from '../types/reviews';
import { getTrainerResponse, submitTrainerResponse, validateTrainerResponseSubmission } from '../services/reviews';

interface TrainerResponseProps {
  reviewId: string;
  isTrainer?: boolean;
  onResponseSubmitted?: () => void;
}

export default function TrainerResponse({ reviewId, isTrainer = false, onResponseSubmitted }: TrainerResponseProps) {
  const [response, setResponse] = useState<TrainerResponseType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadResponse();
  }, [reviewId]);

  const loadResponse = async () => {
    try {
      const data = await getTrainerResponse(reviewId);
      setResponse(data);
    } catch (err) {
      console.error('Failed to load response:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submission = {
      reviewId,
      response: responseText,
    };

    const validation = validateTrainerResponseSubmission(submission);

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setValidationErrors([]);

      await submitTrainerResponse(submission);
      setShowForm(false);
      setResponseText('');
      loadResponse();

      if (onResponseSubmitted) {
        onResponseSubmitted();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  if (response) {
    return (
      <div className="trainer-response existing-response">
        <div className="response-header">
          <span className="response-label">Trainer Response</span>
          <time dateTime={response.timestamp.toISOString()} className="response-date">
            {new Date(response.timestamp).toLocaleDateString()}
          </time>
        </div>
        <p className="response-text">{response.response}</p>
      </div>
    );
  }

  if (!isTrainer) {
    return null;
  }

  return (
    <div className="trainer-response">
      {!showForm ? (
        <button
          type="button"
          className="btn btn-secondary respond-btn"
          onClick={() => setShowForm(true)}
          aria-label="Respond to review"
        >
          Respond to Review
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="response-form" noValidate>
          <div className="form-group">
            <label htmlFor="response-text">
              Your Response <span className="required">*</span>
            </label>
            <textarea
              id="response-text"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Thank the reviewer or address their concerns..."
              rows={4}
              maxLength={1000}
              required
              aria-describedby="response-hint"
            />
            <div id="response-hint" className="character-count">
              {responseText.length} / 1000 characters
            </div>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="alert alert-error" role="alert">
              <ul>
                {validationErrors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                setResponseText('');
                setValidationErrors([]);
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || responseText.trim().length === 0}
            >
              {loading ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
