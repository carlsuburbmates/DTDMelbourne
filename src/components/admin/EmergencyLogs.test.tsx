/**
 * EmergencyLogs Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import EmergencyLogs from './EmergencyLogs';
import * as adminService from '../../services/admin';

// Mock admin service
vi.mock('../../services/admin');

describe('EmergencyLogs Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (adminService.getEmergencyEvents as any).mockImplementation(() => new Promise(() => {}));

    render(<EmergencyLogs />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render emergency events after loading', async () => {
    const mockEvents = [
      {
        id: '1',
        type: 'system',
        severity: 'high',
        message: 'Database connection failed',
        timestamp: '2025-01-01T00:00:00Z',
        resolved: false
      }
    ];

    (adminService.getEmergencyEvents as any).mockResolvedValue({ events: mockEvents, total: 1 });

    render(<EmergencyLogs />);

    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });
  });

  it('should display severity indicators', async () => {
    const mockEvents = [
      {
        id: '1',
        type: 'system',
        severity: 'high',
        message: 'Database connection failed',
        timestamp: '2025-01-01T00:00:00Z',
        resolved: false
      }
    ];

    (adminService.getEmergencyEvents as any).mockResolvedValue({ events: mockEvents, total: 1 });

    render(<EmergencyLogs />);

    await waitFor(() => {
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  it('should handle pagination', async () => {
    const mockEvents = [
      {
        id: '1',
        type: 'system',
        severity: 'high',
        message: 'Database connection failed',
        timestamp: '2025-01-01T00:00:00Z',
        resolved: false
      }
    ];

    (adminService.getEmergencyEvents as any).mockResolvedValue({ events: mockEvents, total: 25 });

    render(<EmergencyLogs />);

    await waitFor(() => {
      const nextPageButton = screen.getByText('Next');
      expect(nextPageButton).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    (adminService.getEmergencyEvents as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<EmergencyLogs />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load emergency events')).toBeInTheDocument();
    });
  });
});
