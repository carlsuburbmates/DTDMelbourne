/**
 * Overview Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Overview from './Overview';
import * as adminService from '../../services/admin';

// Mock admin service
vi.mock('../../services/admin');

describe('Overview Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (adminService.getKPI as any).mockImplementation(() => new Promise(() => {}));

    render(<Overview />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render KPI cards after loading', async () => {
    const mockKPI = {
      totalUsers: 1250,
      activeUsers: 890,
      totalBookings: 450,
      pendingBookings: 23,
      totalReviews: 320,
      pendingReviews: 15,
      featuredTrainers: 8,
      pendingFeatured: 5
    };

    (adminService.getKPI as any).mockResolvedValue(mockKPI);

    render(<Overview />);

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument();
      expect(screen.getByText('320')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  it('should display correct labels for KPI cards', async () => {
    const mockKPI = {
      totalUsers: 1250,
      activeUsers: 890,
      totalBookings: 450,
      pendingBookings: 23,
      totalReviews: 320,
      pendingReviews: 15,
      featuredTrainers: 8,
      pendingFeatured: 5
    };

    (adminService.getKPI as any).mockResolvedValue(mockKPI);

    render(<Overview />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Total Bookings')).toBeInTheDocument();
      expect(screen.getByText('Total Reviews')).toBeInTheDocument();
      expect(screen.getByText('Featured Trainers')).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    (adminService.getKPI as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<Overview />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load KPI data')).toBeInTheDocument();
    });
  });

  it('should format numbers correctly', async () => {
    const mockKPI = {
      totalUsers: 1250,
      activeUsers: 890,
      totalBookings: 450,
      pendingBookings: 23,
      totalReviews: 320,
      pendingReviews: 15,
      featuredTrainers: 8,
      pendingFeatured: 5
    };

    (adminService.getKPI as any).mockResolvedValue(mockKPI);

    render(<Overview />);

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument();
    });
  });
});
