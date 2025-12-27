/**
 * Tests for HelpfulVoting component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HelpfulVoting from './HelpfulVoting';

// Mock reviews service
jest.mock('../services/reviews', () => ({
  voteHelpful: jest.fn().mockResolvedValue({ success: true }),
}));

describe('HelpfulVoting Component', () => {
  const mockReviewId = 'review-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render helpful count', () => {
    render(<HelpfulVoting reviewId={mockReviewId} userId={mockUserId} helpfulCount={10} />);
    expect(screen.getByText('10 people found this helpful')).toBeInTheDocument();
  });

  it('should render vote buttons', () => {
    render(<HelpfulVoting reviewId={mockReviewId} userId={mockUserId} helpfulCount={10} />);
    expect(screen.getByLabelText('Mark as helpful')).toBeInTheDocument();
    expect(screen.getByLabelText('Mark as not helpful')).toBeInTheDocument();
  });

  it('should alert when not logged in', async () => {
    window.alert = jest.fn();
    render(<HelpfulVoting reviewId={mockReviewId} helpfulCount={10} />);
    
    const upvoteButton = screen.getByLabelText('Mark as helpful');
    fireEvent.click(upvoteButton);
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please log in to vote on reviews');
    });
  });

  it('should call voteHelpful on upvote', async () => {
    render(<HelpfulVoting reviewId={mockReviewId} userId={mockUserId} helpfulCount={10} />);
    
    const upvoteButton = screen.getByLabelText('Mark as helpful');
    fireEvent.click(upvoteButton);
    
    await waitFor(() => {
      expect(screen.getByText('11 people found this helpful')).toBeInTheDocument();
    });
  });

  it('should call voteHelpful on downvote', async () => {
    render(<HelpfulVoting reviewId={mockReviewId} userId={mockUserId} helpfulCount={10} />);
    
    const downvoteButton = screen.getByLabelText('Mark as not helpful');
    fireEvent.click(downvoteButton);
    
    await waitFor(() => {
      expect(screen.getByText('9 people found this helpful')).toBeInTheDocument();
    });
  });

  it('should toggle vote on second click', async () => {
    render(<HelpfulVoting reviewId={mockReviewId} userId={mockUserId} helpfulCount={10} />);
    
    const upvoteButton = screen.getByLabelText('Mark as helpful');
    fireEvent.click(upvoteButton);
    
    await waitFor(() => {
      expect(screen.getByText('11 people found this helpful')).toBeInTheDocument();
    });
    
    fireEvent.click(upvoteButton);
    
    await waitFor(() => {
      expect(screen.getByText('10 people found this helpful')).toBeInTheDocument();
    });
  });
});
