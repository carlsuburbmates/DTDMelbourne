/**
 * Tests for Reviews component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Reviews from './Reviews';

// Mock the reviews service
jest.mock('../services/reviews', () => ({
  getTrainerReviews: jest.fn(),
  getReviewAggregation: jest.fn(),
}));

describe('Reviews Component', () => {
  const mockTrainerId = 'trainer-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render reviews header', () => {
    render(<Reviews trainerId={mockTrainerId} userId={mockUserId} />);
    expect(screen.getByRole('region', { name: 'Reviews' })).toBeInTheDocument();
  });

  it('should show write review button for logged in users', () => {
    render(<Reviews trainerId={mockTrainerId} userId={mockUserId} />);
    expect(screen.getByText('Write a Review')).toBeInTheDocument();
  });

  it('should not show write review button for trainers', () => {
    render(<Reviews trainerId={mockTrainerId} userId={mockUserId} isTrainer={true} />);
    expect(screen.queryByText('Write a Review')).not.toBeInTheDocument();
  });

  it('should not show write review button for non-logged in users', () => {
    render(<Reviews trainerId={mockTrainerId} />);
    expect(screen.queryByText('Write a Review')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<Reviews trainerId={mockTrainerId} userId={mockUserId} />);
    expect(screen.getByLabelText('Loading reviews')).toBeInTheDocument();
  });

  it('should display review form when write review button is clicked', async () => {
    render(<Reviews trainerId={mockTrainerId} userId={mockUserId} />);
    const writeButton = screen.getByText('Write a Review');
    fireEvent.click(writeButton);
    await waitFor(() => {
      expect(screen.getByRole('form', { name: /review/i })).toBeInTheDocument();
    });
  });
});
