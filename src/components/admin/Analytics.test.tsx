/**
 * Analytics Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Analytics from './Analytics';
import * as adminService from '../../services/admin';

// Mock admin service
vi.mock('../../services/admin');

describe('Analytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (adminService.getUserBehaviorMetrics as any).mockImplementation(() => new Promise(() => {}));
    (adminService.getBookingMetrics as any).mockImplementation(() => new Promise(() => {}));

    render(<Analytics />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render user behavior metrics after loading', async () => {
    const mockUserMetrics = {
      totalPageViews: 15000,
      uniqueVisitors: 3200,
      avgSessionDuration: 180,
      bounceRate: 35,
      topPages: [
        { page: '/trainers', views: 5000 },
        { page: '/search', views: 3000 }
      ]
    };

    const mockBookingMetrics = {
      totalBookings: 450,
      completedBookings: 380,
      cancelledBookings: 50,
      pendingBookings: 20,
      bookingsByDay: [
        { date: '2025-01-01', count: 15 },
        { date: '2025-01-02', count: 20 }
      ]
    };

    (adminService.getUserBehaviorMetrics as any).mockResolvedValue(mockUserMetrics);
    (adminService.getBookingMetrics as any).mockResolvedValue(mockBookingMetrics);

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('15,000')).toBeInTheDocument();
      expect(screen.getByText('3,200')).toBeInTheDocument();
    });
  });

  it('should render booking metrics after loading', async () => {
    const mockUserMetrics = {
      totalPageViews: 15000,
      uniqueVisitors: 3200,
      avgSessionDuration: 180,
      bounceRate: 35,
      topPages: []
    };

    const mockBookingMetrics = {
      totalBookings: 450,
      completedBookings: 380,
      cancelledBookings: 50,
      pendingBookings: 20,
      bookingsByDay: []
    };

    (adminService.getUserBehaviorMetrics as any).mockResolvedValue(mockUserMetrics);
    (adminService.getBookingMetrics as any).mockResolvedValue(mockBookingMetrics);

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('450')).toBeInTheDocument();
      expect(screen.getByText('380')).toBeInTheDocument();
    });
  });

  it('should display top pages', async () => {
    const mockUserMetrics = {
      totalPageViews: 15000,
      uniqueVisitors: 3200,
      avgSessionDuration: 180,
      bounceRate: 35,
      topPages: [
        { page: '/trainers', views: 5000 },
        { page: '/search', views: 3000 }
      ]
    };

    const mockBookingMetrics = {
      totalBookings: 450,
      completedBookings: 380,
      cancelledBookings: 50,
      pendingBookings: 20,
      bookingsByDay: []
    };

    (adminService.getUserBehaviorMetrics as any).mockResolvedValue(mockUserMetrics);
    (adminService.getBookingMetrics as any).mockResolvedValue(mockBookingMetrics);

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('/trainers')).toBeInTheDocument();
      expect(screen.getByText('/search')).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    (adminService.getUserBehaviorMetrics as any).mockRejectedValue(new Error('Failed to fetch'));
    (adminService.getBookingMetrics as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
    });
  });
});
