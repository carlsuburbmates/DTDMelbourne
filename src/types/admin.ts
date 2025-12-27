/**
 * Admin Dashboard Types
 * 
 * This file contains all TypeScript interfaces and types for the Admin Dashboard feature.
 */

export interface AdminKPI {
  users: {
    total: number;
    active: number;
    newThisWeek: number;
  };
  bookings: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    revenue: number;
  };
  reviews: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  featured: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export interface TrainerVerification {
  id: string;
  trainerId: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: Date;
  verifiedAt?: Date;
  rejectedReason?: string;
}

export interface FeaturedPlacement {
  id: string;
  trainerId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  approvedAt?: Date;
  rejectedReason?: string;
}

export interface AdminTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
}

export interface EmergencyEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
  resolved: boolean;
}

export interface PaymentAudit {
  id: string;
  bookingId: string;
  amount: number;
  status: 'pending' | 'completed';
  timestamp: Date;
}

export interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  responseTime: number;
}

export interface UserBehaviorMetrics {
  pageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: Array<{
    page: string;
    views: number;
  }>;
}

export interface BookingMetrics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  bookingsByDay: Array<{
    date: string;
    count: number;
  }>;
}

export interface TrainerWithVerification {
  id: string;
  name: string;
  email: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  submittedAt: Date;
  verifiedAt?: Date;
  rejectedReason?: string;
}

export interface ReviewWithModeration {
  id: string;
  trainerId: string;
  userId: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
  rejectedReason?: string;
}

export interface AdminFilters {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
