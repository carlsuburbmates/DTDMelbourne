/**
 * HelpfulVoting component for Dog Trainers Directory
 * Handles upvote/downvote functionality for reviews
 */

'use client';

import React, { useState } from 'react';
import { voteHelpful } from '../services/reviews';

interface HelpfulVotingProps {
  reviewId: string;
  userId?: string;
  helpfulCount: number;
}

export default function HelpfulVoting({ reviewId, userId, helpfulCount }: HelpfulVotingProps) {
  const [count, setCount] = useState(helpfulCount);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVote = async (helpful: boolean) => {
    if (!userId) {
      alert('Please log in to vote on reviews');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      // Optimistic update
      const previousVote = userVote;
      const previousCount = count;

      if (previousVote === 'up' && helpful) {
        // Remove upvote
        setUserVote(null);
        setCount(count - 1);
      } else if (previousVote === 'down' && !helpful) {
        // Remove downvote
        setUserVote(null);
        setCount(count + 1);
      } else if (previousVote === 'up' && !helpful) {
        // Change upvote to downvote
        setUserVote('down');
        setCount(count - 2);
      } else if (previousVote === 'down' && helpful) {
        // Change downvote to upvote
        setUserVote('up');
        setCount(count + 2);
      } else if (helpful) {
        // Add upvote
        setUserVote('up');
        setCount(count + 1);
      } else {
        // Add downvote
        setUserVote('down');
        setCount(count - 1);
      }

      await voteHelpful({
        reviewId,
        userId,
        helpful,
      });
    } catch (err) {
      console.error('Failed to vote:', err);
      alert('Failed to vote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="helpful-voting" role="group" aria-label="Helpful voting">
      <span className="helpful-count">
        {count} {count === 1 ? 'person' : 'people'} found this helpful
      </span>
      <div className="vote-buttons">
        <button
          type="button"
          className={`vote-btn upvote ${userVote === 'up' ? 'active' : ''}`}
          onClick={() => handleVote(true)}
          disabled={loading}
          aria-label="Mark as helpful"
          aria-pressed={userVote === 'up'}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
          </svg>
          Helpful
        </button>
        <button
          type="button"
          className={`vote-btn downvote ${userVote === 'down' ? 'active' : ''}`}
          onClick={() => handleVote(false)}
          disabled={loading}
          aria-label="Mark as not helpful"
          aria-pressed={userVote === 'down'}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 20l1.41-1.41L7.83 13H20v-2H7.83l5.58-5.59L12 4l-8 8z" />
          </svg>
          Not Helpful
        </button>
      </div>
    </div>
  );
}
