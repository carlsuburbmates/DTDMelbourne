/**
 * Tests for TrainerResponse component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrainerResponse from './TrainerResponse';

// Mock reviews service
jest.mock('../services/reviews', () => ({
  getTrainerResponse: jest.fn().mockResolvedValue(null),
  submitTrainerResponse: jest.fn().mockResolvedValue({ success: true, id: 'response-123' }),
}));

describe('TrainerResponse Component', () => {
  const mockReviewId = 'review-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render for non-trainers', () => {
    render(<TrainerResponse reviewId={mockReviewId} isTrainer={false} />);
    expect(screen.queryByText('Respond to Review')).not.toBeInTheDocument();
  });

  it('should render respond button for trainers', () => {
    render(<TrainerResponse reviewId={mockReviewId} isTrainer={true} />);
    expect(screen.getByText('Respond to Review')).toBeInTheDocument();
  });

  it('should show form when respond button is clicked', async () => {
    render(<TrainerResponse reviewId={mockReviewId} isTrainer={true} />);
    const respondButton = screen.getByText('Respond to Review');
    fireEvent.click(respondButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Your Response')).toBeInTheDocument();
    });
  });

  it('should render existing response', async () => {
    const mockResponse = {
      id: 'response-123',
      reviewId: mockReviewId,
      trainerId: 'trainer-456',
      response: 'Thank you for your feedback!',
      timestamp: new Date(),
    };
    
    (require('../services/reviews').getTrainerResponse as jest.Mock).mockResolvedValue(mockResponse);
    
    render(<TrainerResponse reviewId={mockReviewId} isTrainer={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Trainer Response')).toBeInTheDocument();
      expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
    });
  });

  it('should call submitTrainerResponse on form submit', async () => {
    render(<TrainerResponse reviewId={mockReviewId} isTrainer={true} />);
    
    const respondButton = screen.getByText('Respond to Review');
    fireEvent.click(respondButton);
    
    const textarea = screen.getByLabelText('Your Response');
    fireEvent.change(textarea, { target: { value: 'Thank you for your review!' } });
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(require('../services/reviews').submitTrainerResponse).toHaveBeenCalledWith({
        reviewId: mockReviewId,
        response: 'Thank you for your review!',
      });
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<TrainerResponse reviewId={mockReviewId} isTrainer={true} />);
    
    const respondButton = screen.getByText('Respond to Review');
    fireEvent.click(respondButton);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('should show character count', () => {
    render(<TrainerResponse reviewId={mockReviewId} isTrainer={true} />);
    
    const respondButton = screen.getByText('Respond to Review');
    fireEvent.click(respondButton);
    
    expect(screen.getByText('0 / 1000 characters')).toBeInTheDocument();
  });

  it('should update character count on input', () => {
    render(<TrainerResponse reviewId={mockReviewId} isTrainer={true} />);
    
    const respondButton = screen.getByText('Respond to Review');
    fireEvent.click(respondButton);
    
    const textarea = screen.getByLabelText('Your Response');
    fireEvent.change(textarea, { target: { value: 'Test response' } });
    
    expect(screen.getByText('13 / 1000 characters')).toBeInTheDocument();
  });
});
