/**
 * Admin Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getKPI,
  getTrainers,
  verifyTrainer,
  approveFeaturedPlacement,
  getPendingReviews,
  approveReview,
  rejectReview,
  getPendingFeaturedRequests,
  approveFeatured,
  rejectFeatured,
  getUserBehaviorMetrics,
  getBookingMetrics,
  getEmergencyEvents,
  getPaymentAudit,
  getSystemHealth,
  getTasks,
  createTask,
  assignTask,
  completeTask,
  calculateKPI
} from './admin';
import type {
  AdminKPI,
  TrainerWithVerification,
  ReviewWithModeration,
  FeaturedPlacement,
  AdminTask,
  UserBehaviorMetrics,
  BookingMetrics,
  EmergencyEvent,
  PaymentAudit,
  SystemHealth
} from '../types/admin';

// Mock fetch globally
global.fetch = vi.fn();

describe('Admin Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getKPI', () => {
    it('should fetch KPI metrics successfully', async () => {
      const mockKPI: AdminKPI = {
        totalUsers: 1250,
        activeUsers: 890,
        totalBookings: 450,
        pendingBookings: 23,
        totalReviews: 320,
        pendingReviews: 15,
        featuredTrainers: 8,
        pendingFeatured: 5
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockKPI
      });

      const result = await getKPI();
      expect(result).toEqual(mockKPI);
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/admin/kpi');
    });

    it('should handle fetch errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(getKPI()).rejects.toThrow('Failed to fetch KPI');
    });
  });

  describe('getTrainers', () => {
    it('should fetch trainers with filters', async () => {
      const mockTrainers: TrainerWithVerification[] = [
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

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trainers: mockTrainers, total: 1 })
      });

      const result = await getTrainers({ status: 'verified', page: 1 });
      expect(result.trainers).toEqual(mockTrainers);
      expect(result.total).toBe(1);
    });

    it('should handle fetch errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(getTrainers({})).rejects.toThrow('Failed to fetch trainers');
    });
  });

  describe('verifyTrainer', () => {
    it('should verify a trainer successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await verifyTrainer('trainer-1', true);
      expect(result).toBe(true);
    });

    it('should reject a trainer with reason', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await verifyTrainer('trainer-1', false, 'Invalid documents');
      expect(result).toBe(true);
    });
  });

  describe('approveFeaturedPlacement', () => {
    it('should approve featured placement', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await approveFeaturedPlacement('trainer-1', true);
      expect(result).toBe(true);
    });

    it('should reject featured placement with reason', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await approveFeaturedPlacement('trainer-1', false, 'Not eligible');
      expect(result).toBe(true);
    });
  });

  describe('getPendingReviews', () => {
    it('should fetch pending reviews', async () => {
      const mockReviews: ReviewWithModeration[] = [
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

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reviews: mockReviews, total: 1 })
      });

      const result = await getPendingReviews({ page: 1 });
      expect(result.reviews).toEqual(mockReviews);
      expect(result.total).toBe(1);
    });
  });

  describe('approveReview', () => {
    it('should approve a review', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await approveReview('review-1');
      expect(result).toBe(true);
    });
  });

  describe('rejectReview', () => {
    it('should reject a review with reason', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await rejectReview('review-1', 'Inappropriate content');
      expect(result).toBe(true);
    });
  });

  describe('getPendingFeaturedRequests', () => {
    it('should fetch pending featured requests', async () => {
      const mockRequests: FeaturedPlacement[] = [
        {
          id: '1',
          trainerId: 'trainer-1',
          trainerName: 'John Doe',
          status: 'pending',
          requestedAt: '2025-01-01T00:00:00Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ placements: mockRequests, total: 1 })
      });

      const result = await getPendingFeaturedRequests({ page: 1 });
      expect(result.placements).toEqual(mockRequests);
      expect(result.total).toBe(1);
    });
  });

  describe('approveFeatured', () => {
    it('should approve featured request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await approveFeatured('placement-1');
      expect(result).toBe(true);
    });
  });

  describe('rejectFeatured', () => {
    it('should reject featured request with reason', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await rejectFeatured('placement-1', 'Not eligible');
      expect(result).toBe(true);
    });
  });

  describe('getUserBehaviorMetrics', () => {
    it('should fetch user behavior metrics', async () => {
      const mockMetrics: UserBehaviorMetrics = {
        totalPageViews: 15000,
        uniqueVisitors: 3200,
        avgSessionDuration: 180,
        bounceRate: 35,
        topPages: [
          { page: '/trainers', views: 5000 },
          { page: '/search', views: 3000 }
        ]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics
      });

      const result = await getUserBehaviorMetrics();
      expect(result).toEqual(mockMetrics);
    });
  });

  describe('getBookingMetrics', () => {
    it('should fetch booking metrics', async () => {
      const mockMetrics: BookingMetrics = {
        totalBookings: 450,
        completedBookings: 380,
        cancelledBookings: 50,
        pendingBookings: 20,
        bookingsByDay: [
          { date: '2025-01-01', count: 15 },
          { date: '2025-01-02', count: 20 }
        ]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics
      });

      const result = await getBookingMetrics();
      expect(result).toEqual(mockMetrics);
    });
  });

  describe('getEmergencyEvents', () => {
    it('should fetch emergency events', async () => {
      const mockEvents: EmergencyEvent[] = [
        {
          id: '1',
          type: 'system',
          severity: 'high',
          message: 'Database connection failed',
          timestamp: '2025-01-01T00:00:00Z',
          resolved: false
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockEvents, total: 1 })
      });

      const result = await getEmergencyEvents({ page: 1 });
      expect(result.events).toEqual(mockEvents);
      expect(result.total).toBe(1);
    });
  });

  describe('getPaymentAudit', () => {
    it('should fetch payment audit', async () => {
      const mockAudit: PaymentAudit[] = [
        {
          id: '1',
          bookingId: 'booking-1',
          amount: 10000,
          status: 'completed',
          timestamp: '2025-01-01T00:00:00Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ payments: mockAudit, total: 1 })
      });

      const result = await getPaymentAudit({ page: 1 });
      expect(result.payments).toEqual(mockAudit);
      expect(result.total).toBe(1);
    });
  });

  describe('getSystemHealth', () => {
    it('should fetch system health', async () => {
      const mockHealth: SystemHealth = {
        status: 'healthy',
        cpuUsage: 45,
        memoryUsage: 60,
        diskUsage: 55,
        uptime: 86400,
        responseTime: 120
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth
      });

      const result = await getSystemHealth();
      expect(result).toEqual(mockHealth);
    });
  });

  describe('getTasks', () => {
    it('should fetch tasks with filters', async () => {
      const mockTasks: AdminTask[] = [
        {
          id: '1',
          title: 'Review trainer applications',
          description: 'Review pending trainer applications',
          priority: 'high',
          status: 'pending',
          assignedTo: 'admin-1',
          dueDate: '2025-01-10T00:00:00Z',
          createdAt: '2025-01-01T00:00:00Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: mockTasks, total: 1 })
      });

      const result = await getTasks({ status: 'pending', page: 1 });
      expect(result.tasks).toEqual(mockTasks);
      expect(result.total).toBe(1);
    });
  });

  describe('createTask', () => {
    it('should create a task', async () => {
      const newTask = {
        title: 'New task',
        description: 'Task description',
        priority: 'medium' as const,
        dueDate: '2025-01-10T00:00:00Z'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await createTask(newTask);
      expect(result).toBe(true);
    });
  });

  describe('assignTask', () => {
    it('should assign a task', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await assignTask('task-1', 'admin-1');
      expect(result).toBe(true);
    });
  });

  describe('completeTask', () => {
    it('should complete a task', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await completeTask('task-1');
      expect(result).toBe(true);
    });
  });

  describe('calculateKPI', () => {
    it('should calculate KPI from raw data', () => {
      const rawData = {
        users: 1250,
        bookings: 450,
        reviews: 320,
        featured: 8
      };

      const result = calculateKPI(rawData);
      expect(result.totalUsers).toBe(1250);
      expect(result.totalBookings).toBe(450);
      expect(result.totalReviews).toBe(320);
      expect(result.featuredTrainers).toBe(8);
    });
  });
});
