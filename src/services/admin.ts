/**
 * Admin Service
 * 
 * This service handles all admin dashboard operations including KPI aggregation,
 * trainer verification, featured placement management, review moderation,
 * task management, emergency event tracking, payment audit, and system health monitoring.
 */

import {
  AdminKPI,
  TrainerVerification,
  FeaturedPlacement,
  AdminTask,
  EmergencyEvent,
  PaymentAudit,
  SystemHealth,
  UserBehaviorMetrics,
  BookingMetrics,
  TrainerWithVerification,
  ReviewWithModeration,
  AdminFilters,
  PaginatedResponse,
} from '../types/admin';

const API_BASE = '/api/v1/admin';

/**
 * Fetch KPI metrics for the admin dashboard
 */
export async function getKPI(): Promise<AdminKPI> {
  const response = await fetch(`${API_BASE}/kpi`);
  if (!response.ok) {
    throw new Error('Failed to fetch KPI metrics');
  }
  const data = await response.json();
  return data.kpi;
}

/**
 * Fetch trainers with optional filters
 */
export async function getTrainers(
  filters: AdminFilters = {}
): Promise<PaginatedResponse<TrainerWithVerification>> {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`${API_BASE}/trainers?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch trainers');
  }
  return response.json();
}

/**
 * Verify or reject a trainer
 */
export async function verifyTrainer(
  trainerId: string,
  status: 'verified' | 'rejected',
  rejectedReason?: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/trainers/${trainerId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, rejectedReason }),
  });
  if (!response.ok) {
    throw new Error('Failed to verify trainer');
  }
  return response.json();
}

/**
 * Approve or reject featured placement for a trainer
 */
export async function approveFeaturedPlacement(
  trainerId: string,
  status: 'approved' | 'rejected',
  rejectedReason?: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/trainers/${trainerId}/featured`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, rejectedReason }),
  });
  if (!response.ok) {
    throw new Error('Failed to approve featured placement');
  }
  return response.json();
}

/**
 * Fetch pending reviews for moderation
 */
export async function getPendingReviews(
  filters: AdminFilters = {}
): Promise<PaginatedResponse<ReviewWithModeration>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`${API_BASE}/reviews/pending?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch pending reviews');
  }
  return response.json();
}

/**
 * Approve a review
 */
export async function approveReview(reviewId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/reviews/${reviewId}/approve`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to approve review');
  }
  return response.json();
}

/**
 * Reject a review
 */
export async function rejectReview(
  reviewId: string,
  rejectedReason?: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/reviews/${reviewId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejectedReason }),
  });
  if (!response.ok) {
    throw new Error('Failed to reject review');
  }
  return response.json();
}

/**
 * Fetch pending featured placement requests
 */
export async function getPendingFeaturedRequests(
  filters: AdminFilters = {}
): Promise<PaginatedResponse<FeaturedPlacement>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`${API_BASE}/featured/pending?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch pending featured requests');
  }
  return response.json();
}

/**
 * Approve a featured placement
 */
export async function approveFeatured(placementId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/featured/${placementId}/approve`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to approve featured placement');
  }
  return response.json();
}

/**
 * Reject a featured placement
 */
export async function rejectFeatured(
  placementId: string,
  rejectedReason?: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/featured/${placementId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejectedReason }),
  });
  if (!response.ok) {
    throw new Error('Failed to reject featured placement');
  }
  return response.json();
}

/**
 * Fetch user behavior analytics metrics
 */
export async function getUserBehaviorMetrics(): Promise<UserBehaviorMetrics> {
  const response = await fetch(`${API_BASE}/analytics/user-behavior`);
  if (!response.ok) {
    throw new Error('Failed to fetch user behavior metrics');
  }
  const data = await response.json();
  return data.metrics;
}

/**
 * Fetch booking analytics metrics
 */
export async function getBookingMetrics(): Promise<BookingMetrics> {
  const response = await fetch(`${API_BASE}/analytics/bookings`);
  if (!response.ok) {
    throw new Error('Failed to fetch booking metrics');
  }
  const data = await response.json();
  return data.metrics;
}

/**
 * Fetch emergency events
 */
export async function getEmergencyEvents(limit: number = 50): Promise<EmergencyEvent[]> {
  const response = await fetch(`${API_BASE}/emergency/events?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch emergency events');
  }
  const data = await response.json();
  return data.events;
}

/**
 * Fetch payment audit records
 */
export async function getPaymentAudit(): Promise<PaymentAudit[]> {
  const response = await fetch(`${API_BASE}/payments/audit`);
  if (!response.ok) {
    throw new Error('Failed to fetch payment audit');
  }
  const data = await response.json();
  return data.audits;
}

/**
 * Fetch system health metrics
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const response = await fetch(`${API_BASE}/system/health`);
  if (!response.ok) {
    throw new Error('Failed to fetch system health');
  }
  const data = await response.json();
  return data.health;
}

/**
 * Fetch admin tasks
 */
export async function getTasks(filters: AdminFilters = {}): Promise<AdminTask[]> {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);

  const response = await fetch(`${API_BASE}/tasks?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  const data = await response.json();
  return data.tasks;
}

/**
 * Create a new admin task
 */
export async function createTask(task: Omit<AdminTask, 'id'>): Promise<{ success: boolean; id: string }> {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!response.ok) {
    throw new Error('Failed to create task');
  }
  return response.json();
}

/**
 * Assign a task to a user
 */
export async function assignTask(taskId: string, assignedTo: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignedTo }),
  });
  if (!response.ok) {
    throw new Error('Failed to assign task');
  }
  return response.json();
}

/**
 * Complete a task
 */
export async function completeTask(taskId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to complete task');
  }
  return response.json();
}

/**
 * Calculate KPI metrics from raw data
 */
export function calculateKPI(
  users: any[],
  bookings: any[],
  reviews: any[],
  featured: any[]
): AdminKPI {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const activeUsers = users.filter((u) => u.lastLoginAt && new Date(u.lastLoginAt) > oneWeekAgo);
  const newUsers = users.filter((u) => new Date(u.createdAt) > oneWeekAgo);

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');
  const revenue = completedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  const pendingReviews = reviews.filter((r) => r.status === 'pending');
  const approvedReviews = reviews.filter((r) => r.status === 'approved');
  const rejectedReviews = reviews.filter((r) => r.status === 'rejected');

  const pendingFeatured = featured.filter((f) => f.status === 'pending');
  const approvedFeatured = featured.filter((f) => f.status === 'approved');
  const rejectedFeatured = featured.filter((f) => f.status === 'rejected');

  return {
    users: {
      total: users.length,
      active: activeUsers.length,
      newThisWeek: newUsers.length,
    },
    bookings: {
      total: bookings.length,
      pending: pendingBookings.length,
      completed: completedBookings.length,
      cancelled: cancelledBookings.length,
      revenue,
    },
    reviews: {
      total: reviews.length,
      pending: pendingReviews.length,
      approved: approvedReviews.length,
      rejected: rejectedReviews.length,
    },
    featured: {
      total: featured.length,
      pending: pendingFeatured.length,
      approved: approvedFeatured.length,
      rejected: rejectedFeatured.length,
    },
  };
}
