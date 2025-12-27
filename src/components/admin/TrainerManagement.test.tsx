/**
 * TrainerManagement Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TrainerManagement from './TrainerManagement';
import * as adminService from '../../services/admin';

// Mock admin service
vi.mock('../../services/admin');

describe('TrainerManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (adminService.getTrainers as any).mockImplementation(() => new Promise(() => {}));

    render(<TrainerManagement />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render trainer list after loading', async () => {
    const mockTrainers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        verificationStatus: 'verified',
        location: 'New York',
        rating: 4.5,
        reviewsCount: 120
      }
    ];

    (adminService.getTrainers as any).mockResolvedValue({ trainers: mockTrainers, total: 1 });

    render(<TrainerManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('should filter trainers by status', async () => {
    const mockTrainers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        verificationStatus: 'verified',
        location: 'New York',
        rating: 4.5,
        reviewsCount: 120
      }
    ];

    (adminService.getTrainers as any).mockResolvedValue({ trainers: mockTrainers, total: 1 });

    render(<TrainerManagement />);

    await waitFor(() => {
      const statusFilter = screen.getByLabelText('Status');
      fireEvent.change(statusFilter, { target: { value: 'verified' } });
    });

    expect(adminService.getTrainers).toHaveBeenCalledWith({ status: 'verified', page: 1 });
  });

  it('should verify a trainer', async () => {
    const mockTrainers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        verificationStatus: 'pending',
        location: 'New York',
        rating: 4.5,
        reviewsCount: 120
      }
    ];

    (adminService.getTrainers as any).mockResolvedValue({ trainers: mockTrainers, total: 1 });
    (adminService.verifyTrainer as any).mockResolvedValue(true);

    render(<TrainerManagement />);

    await waitFor(() => {
      const verifyButton = screen.getByText('Verify');
      fireEvent.click(verifyButton);
    });

    expect(adminService.verifyTrainer).toHaveBeenCalledWith('1', true);
  });

  it('should open reject modal when reject button clicked', async () => {
    const mockTrainers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        verificationStatus: 'pending',
        location: 'New York',
        rating: 4.5,
        reviewsCount: 120
      }
    ];

    (adminService.getTrainers as any).mockResolvedValue({ trainers: mockTrainers, total: 1 });

    render(<TrainerManagement />);

    await waitFor(() => {
      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);
    });

    expect(screen.getByText('Reject Trainer')).toBeInTheDocument();
  });

  it('should handle pagination', async () => {
    const mockTrainers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        verificationStatus: 'verified',
        location: 'New York',
        rating: 4.5,
        reviewsCount: 120
      }
    ];

    (adminService.getTrainers as any).mockResolvedValue({ trainers: mockTrainers, total: 25 });

    render(<TrainerManagement />);

    await waitFor(() => {
      const nextPageButton = screen.getByText('Next');
      fireEvent.click(nextPageButton);
    });

    expect(adminService.getTrainers).toHaveBeenCalledWith({ page: 2 });
  });

  it('should handle error state', async () => {
    (adminService.getTrainers as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<TrainerManagement />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load trainers')).toBeInTheDocument();
    });
  });
});
