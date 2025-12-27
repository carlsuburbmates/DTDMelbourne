/**
 * FeaturedPlacement Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import FeaturedPlacement from './FeaturedPlacement';
import * as adminService from '../../services/admin';

// Mock admin service
vi.mock('../../services/admin');

describe('FeaturedPlacement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (adminService.getPendingFeaturedRequests as any).mockImplementation(() => new Promise(() => {}));

    render(<FeaturedPlacement />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render featured placement list after loading', async () => {
    const mockPlacements = [
      {
        id: '1',
        trainerId: 'trainer-1',
        trainerName: 'John Doe',
        status: 'pending',
        requestedAt: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getPendingFeaturedRequests as any).mockResolvedValue({ placements: mockPlacements, total: 1 });

    render(<FeaturedPlacement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should approve a featured placement', async () => {
    const mockPlacements = [
      {
        id: '1',
        trainerId: 'trainer-1',
        trainerName: 'John Doe',
        status: 'pending',
        requestedAt: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getPendingFeaturedRequests as any).mockResolvedValue({ placements: mockPlacements, total: 1 });
    (adminService.approveFeatured as any).mockResolvedValue(true);

    render(<FeaturedPlacement />);

    await waitFor(() => {
      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);
    });

    expect(adminService.approveFeatured).toHaveBeenCalledWith('1');
  });

  it('should open reject modal when reject button clicked', async () => {
    const mockPlacements = [
      {
        id: '1',
        trainerId: 'trainer-1',
        trainerName: 'John Doe',
        status: 'pending',
        requestedAt: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getPendingFeaturedRequests as any).mockResolvedValue({ placements: mockPlacements, total: 1 });

    render(<FeaturedPlacement />);

    await waitFor(() => {
      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);
    });

    expect(screen.getByText('Reject Featured Request')).toBeInTheDocument();
  });

  it('should handle pagination', async () => {
    const mockPlacements = [
      {
        id: '1',
        trainerId: 'trainer-1',
        trainerName: 'John Doe',
        status: 'pending',
        requestedAt: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getPendingFeaturedRequests as any).mockResolvedValue({ placements: mockPlacements, total: 25 });

    render(<FeaturedPlacement />);

    await waitFor(() => {
      const nextPageButton = screen.getByText('Next');
      fireEvent.click(nextPageButton);
    });

    expect(adminService.getPendingFeaturedRequests).toHaveBeenCalledWith({ page: 2 });
  });

  it('should handle error state', async () => {
    (adminService.getPendingFeaturedRequests as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<FeaturedPlacement />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load featured requests')).toBeInTheDocument();
    });
  });
});
