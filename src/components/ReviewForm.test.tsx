/**
 * Tests for ReviewForm component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewForm from './ReviewForm';

// Mock reviews service
jest.mock('../services/reviews', () => ({
  submitReview: jest.fn(),
  getReviewCategories: jest.fn().mockResolvedValue([
    { id: '1', name: 'Communication', description: 'How well trainer communicates' },
    { id: '2', name: 'Professionalism', description: 'Professional conduct' },
  ]),
}));

describe('ReviewForm Component', () => {
  const mockTrainerId = 'trainer-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields', () => {
    render(<ReviewForm trainerId={mockTrainerId} userId={mockUserId} onSubmit={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByLabelText('Overall Rating')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Review')).toBeInTheDocument();
  });

  it('should render category ratings', async () => {
    render(<ReviewForm trainerId={mockTrainerId} userId={mockUserId} onSubmit={jest.fn()} onCancel={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText('Professionalism')).toBeInTheDocument();
    });
  });

  it('should show character count', () => {
    render(<ReviewForm trainerId={mockTrainerId} userId={mockUserId} onSubmit={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByText('0 / 1000 characters')).toBeInTheDocument();
  });

  it('should update character count on input', () => {
    render(<ReviewForm trainerId={mockTrainerId} userId={mockUserId} onSubmit={jest.fn()} onCancel={jest.fn()} />);
    const textarea = screen.getByLabelText('Your Review');
    fireEvent.change(textarea, { target: { value: 'Test review' } });
    expect(screen.getByText('11 / 1000 characters')).toBeInTheDocument();
  });

  it('should call onSubmit when form is submitted', async () => {
    const onSubmit = jest.fn();
    render(<ReviewForm trainerId={mockTrainerId} userId={mockUserId} onSubmit={onSubmit} onCancel={jest.fn()} />);
    
    const textarea = screen.getByLabelText('Your Review');
    fireEvent.change(textarea, { target: { value: 'Great trainer!' } });
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(<ReviewForm trainerId={mockTrainerId} userId={mockUserId} onSubmit={jest.fn()} onCancel={onCancel} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('should disable submit button when rating is 0', () => {
    render(<ReviewForm trainerId={mockTrainerId} userId={mockUserId} onSubmit={jest.fn()} onCancel={jest.fn()} />);
    const submitButton = screen.getByText('Submit Review');
    expect(submitButton).toBeDisabled();
  });

  it('should disable submit button when comment is empty', () => {
    render(<ReviewForm trainerId={mockTrainerId} userId={mockUserId} onSubmit={jest.fn()} onCancel={jest.fn()} />);
    const submitButton = screen.getByText('Submit Review');
    expect(submitButton).toBeDisabled();
  });
});
