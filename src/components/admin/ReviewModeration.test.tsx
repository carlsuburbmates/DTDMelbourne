/**
 * ReviewModeration Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ReviewModeration from './ReviewModeration';
import * as adminService from '../../services/admin';

// Mock admin service
vi.mock('../../services/admin');

describe('ReviewModeration Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (adminService.getPendingReviews as any).mockImplementation(() => new Promise(() => {}));

    render(<ReviewModeration />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render review list after loading', async () => {
    const mockReviews = [
      {
        id: '1',
        trainerId: 'trainer-1',
        trainerName: 'John Doe',
        userId: 'user-1',
        userName: 'Jane Smith',
        rating: 5,
        comment: 'Great trainer!',
        createdAt: '2025-01-01T00:00:00Z',
        moderationStatus: 'pending'
      }
    ];

    (adminService.getPendingReviews as any).mockResolvedValue({ reviews: mockReviews, total: 1 });

    render(<ReviewModeration />);

    await waitFor(() => {
      expect(screen.getByText('Great trainer!')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should approve a review', async () => {
    const mockReviews = [
      {
        id: '1',
        trainerId: 'trainer-1',
        trainerName: 'John Doe',
        userId: 'user-1',
        userName: 'Jane Smith',
        rating: 5,
        comment: 'Great trainer!',
        createdAt: '2025-01-01T00:00:00Z',
        moderationStatus: 'pending'
      }
    ];

    (adminService.getPendingReviews as any).mockResolvedValue({ reviews: mockReviews, total: 1 });
    (adminService.approveReview as any).mockResolvedValue(true);

    render(<ReviewModeration />);

    await waitFor(() => {
      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);
    });

    expect(adminService.approveReview).toHaveBeenCalledWith('1');
  });

  it('should open reject modal when reject button clicked', async () => {
    const mockReviews = [
      {
        id: '1',
        trainerId: 'trainer-1',
        trainerName: 'John Doe',
        userId: 'user-1',
        userName: 'Jane Smith',
        rating: 5,
        comment: 'Great trainer!',
        createdAt: '2025-01-01T00:00:00Z',
        moderationStatus: 'pending'
      }
    ];

    (adminService.getPendingReviews as any).mockResolvedValue({ reviews: mockReviews, total: 1 });

    render(<ReviewModeration />);

    await waitFor(() => {
      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);
    });

    expect(screen.getByText('Reject Review')).toBeInTheDocument();
  });

  it('should handle pagination', async () => {
    const mockReviews = [
      {
        id: '1',
        trainerId: 'trainer-1',
        trainerName: 'John Doe',
        userId: 'user-1',
        userName: 'Jane Smith',
        rating: 5,
        comment: 'Great trainer!',
        createdAt: '2025-01-01T00:00:00Z',
        moderationStatus: 'pending'
      }
    ];

    (adminService.getPendingReviews as any).mockResolvedValue({ reviews: mockReviews, total: 25 });

    render(<ReviewModeration />);

    await waitFor(() => {
      const nextPageButton = screen.getByText('Next');
      fireEvent.click(nextPageButton);
    });

    expect(adminService.getPendingReviews).toHaveBeenCalledWith({ page: 2 });
  });

  it('should handle error state', async () => {
    (adminService.getPendingReviews as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<ReviewModeration />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load reviews')).toBeInTheDocument();
    });
  });
});
