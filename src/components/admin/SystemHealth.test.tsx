/**
 * SystemHealth Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SystemHealth from './SystemHealth';
import * as adminService from '../../services/admin';

// Mock admin service
vi.mock('../../services/admin');

describe('SystemHealth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    (adminService.getSystemHealth as any).mockImplementation(() => new Promise(() => {}));

    render(<SystemHealth />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render system health after loading', async () => {
    const mockHealth = {
      status: 'healthy',
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      uptime: 86400,
      responseTime: 120
    };

    (adminService.getSystemHealth as any).mockResolvedValue(mockHealth);

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });

  it('should display CPU usage', async () => {
    const mockHealth = {
      status: 'healthy',
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      uptime: 86400,
      responseTime: 120
    };

    (adminService.getSystemHealth as any).mockResolvedValue(mockHealth);

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument();
    });
  });

  it('should display memory usage', async () => {
    const mockHealth = {
      status: 'healthy',
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      uptime: 86400,
      responseTime: 120
    };

    (adminService.getSystemHealth as any).mockResolvedValue(mockHealth);

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });

  it('should display disk usage', async () => {
    const mockHealth = {
      status: 'healthy',
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      uptime: 86400,
      responseTime: 120
    };

    (adminService.getSystemHealth as any).mockResolvedValue(mockHealth);

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('55%')).toBeInTheDocument();
    });
  });

  it('should display uptime', async () => {
    const mockHealth = {
      status: 'healthy',
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      uptime: 86400,
      responseTime: 120
    };

    (adminService.getSystemHealth as any).mockResolvedValue(mockHealth);

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('1 day')).toBeInTheDocument();
    });
  });

  it('should display response time', async () => {
    const mockHealth = {
      status: 'healthy',
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      uptime: 86400,
      responseTime: 120
    };

    (adminService.getSystemHealth as any).mockResolvedValue(mockHealth);

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('120ms')).toBeInTheDocument();
    });
  });

  it('should auto-refresh every 30 seconds', async () => {
    const mockHealth = {
      status: 'healthy',
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      uptime: 86400,
      responseTime: 120
    };

    (adminService.getSystemHealth as any).mockResolvedValue(mockHealth);

    render(<SystemHealth />);

    await waitFor(() => {
      expect(adminService.getSystemHealth).toHaveBeenCalledTimes(1);
    });

    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(adminService.getSystemHealth).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle error state', async () => {
    (adminService.getSystemHealth as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<SystemHealth />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load system health')).toBeInTheDocument();
    });
  });
});
