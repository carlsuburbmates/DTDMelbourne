/**
 * PaymentAudit Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PaymentAudit from './PaymentAudit';
import * as adminService from '../../services/admin';

// Mock admin service
vi.mock('../../services/admin');

describe('PaymentAudit Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (adminService.getPaymentAudit as any).mockImplementation(() => new Promise(() => {}));

    render(<PaymentAudit />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render payment audit after loading', async () => {
    const mockAudit = [
      {
        id: '1',
        bookingId: 'booking-1',
        amount: 10000,
        status: 'completed',
        timestamp: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getPaymentAudit as any).mockResolvedValue({ payments: mockAudit, total: 1 });

    render(<PaymentAudit />);

    await waitFor(() => {
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });
  });

  it('should calculate total revenue', async () => {
    const mockAudit = [
      {
        id: '1',
        bookingId: 'booking-1',
        amount: 10000,
        status: 'completed',
        timestamp: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        bookingId: 'booking-2',
        amount: 15000,
        status: 'completed',
        timestamp: '2025-01-02T00:00:00Z'
      }
    ];

    (adminService.getPaymentAudit as any).mockResolvedValue({ payments: mockAudit, total: 2 });

    render(<PaymentAudit />);

    await waitFor(() => {
      expect(screen.getByText('$250.00')).toBeInTheDocument();
    });
  });

  it('should calculate pending revenue', async () => {
    const mockAudit = [
      {
        id: '1',
        bookingId: 'booking-1',
        amount: 10000,
        status: 'pending',
        timestamp: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getPaymentAudit as any).mockResolvedValue({ payments: mockAudit, total: 1 });

    render(<PaymentAudit />);

    await waitFor(() => {
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });
  });

  it('should calculate refunded revenue', async () => {
    const mockAudit = [
      {
        id: '1',
        bookingId: 'booking-1',
        amount: 10000,
        status: 'refunded',
        timestamp: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getPaymentAudit as any).mockResolvedValue({ payments: mockAudit, total: 1 });

    render(<PaymentAudit />);

    await waitFor(() => {
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });
  });

  it('should handle pagination', async () => {
    const mockAudit = [
      {
        id: '1',
        bookingId: 'booking-1',
        amount: 10000,
        status: 'completed',
        timestamp: '2025-01-01T00:00:00Z'
      }
    ];

    (adminService.getPaymentAudit as any).mockResolvedValue({ payments: mockAudit, total: 25 });

    render(<PaymentAudit />);

    await waitFor(() => {
      const nextPageButton = screen.getByText('Next');
      expect(nextPageButton).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    (adminService.getPaymentAudit as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<PaymentAudit />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load payment audit')).toBeInTheDocument();
    });
  });
});
