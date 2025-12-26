// ============================================================================
// DTD Phase 5: Operations - Admin Dashboard Service
// File: src/lib/admin-dashboard.ts
// Description: Admin dashboard statistics and overview service
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import type {
  Business,
  Review,
  FeaturedPlacement,
  TriageLog,
  PaymentAudit,
  ReviewModerationStatus,
  FeaturedPlacementStatus,
  DogTriageClassification,
} from '../types/database';
import {
  DatabaseError,
  logError,
  handleSupabaseError,
} from './errors';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Dashboard overview statistics
 */
export interface DashboardOverview {
  total_trainers: number;
  verified_trainers: number;
  pending_trainers: number;
  total_reviews: number;
  pending_reviews: number;
  total_featured: number;
  active_featured: number;
  queued_featured: number;
  total_emergency_triage: number;
  medical_triage: number;
  crisis_triage: number;
  total_payments: number;
  total_revenue: number;
  recent_activity: ActivityLog[];
  pending_actions: PendingAction[];
}

/**
 * Trainer statistics
 */
export interface TrainerStats {
  total: number;
  verified: number;
  unverified: number;
  claimed: number;
  unclaimed: number;
  by_council: CouncilStats[];
  by_resource_type: ResourceTypeStats[];
  by_data_source: DataSourceStats[];
  new_this_week: number;
  new_this_month: number;
}

/**
 * Review statistics
 */
export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  average_rating: number;
  by_rating: RatingStats[];
  by_council: CouncilStats[];
  new_this_week: number;
  new_this_month: number;
}

/**
 * Payment statistics
 */
export interface PaymentStats {
  total_payments: number;
  total_revenue: number;
  revenue_this_week: number;
  revenue_this_month: number;
  average_transaction: number;
  by_council: CouncilStats[];
  successful_payments: number;
  failed_payments: number;
  refund_count: number;
  refund_amount: number;
}

/**
 * Emergency triage statistics
 */
export interface EmergencyStats {
  total_triage: number;
  medical: number;
  crisis: number;
  stray: number;
  normal: number;
  average_confidence: number;
  by_council: CouncilStats[];
  new_this_week: number;
  new_this_month: number;
  ai_response_rate: number;
}

/**
 * Featured placement statistics
 */
export interface FeaturedStats {
  total: number;
  active: number;
  queued: number;
  expired: number;
  refunded: number;
  cancelled: number;
  by_council: CouncilStats[];
  queue_length: number;
  average_queue_time: number;
  revenue_this_month: number;
}

/**
 * Activity log entry
 */
export interface ActivityLog {
  id: string;
  type: 'trainer' | 'review' | 'payment' | 'triage' | 'featured';
  action: string;
  description: string;
  entity_id: string;
  entity_name: string;
  user_id: string | null;
  created_at: Date;
}

/**
 * Pending action
 */
export interface PendingAction {
  id: string;
  type: 'review' | 'trainer' | 'featured_queue';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  entity_id: string;
  entity_name: string;
  created_at: Date;
  due_date?: Date;
}

/**
 * Council statistics
 */
export interface CouncilStats {
  council_id: string;
  council_name: string;
  count: number;
  percentage: number;
}

/**
 * Resource type statistics
 */
export interface ResourceTypeStats {
  resource_type: string;
  count: number;
  percentage: number;
}

/**
 * Data source statistics
 */
export interface DataSourceStats {
  data_source: string;
  count: number;
  percentage: number;
}

/**
 * Rating statistics
 */
export interface RatingStats {
  rating: number;
  count: number;
  percentage: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * Admin dashboard service
 */
export class AdminDashboardService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ============================================================================
  // DASHBOARD OVERVIEW
  // ============================================================================

  /**
   * Get dashboard overview statistics
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    try {
      const [
        trainerStats,
        reviewStats,
        featuredStats,
        emergencyStats,
        paymentStats,
        recentActivity,
        pendingActions,
      ] = await Promise.all([
        this.getTrainerStats(),
        this.getReviewStats(),
        this.getFeaturedStats(),
        this.getEmergencyStats(),
        this.getPaymentStats(),
        this.getRecentActivity(10),
        this.getPendingActions(),
      ]);

      return {
        total_trainers: trainerStats.total,
        verified_trainers: trainerStats.verified,
        pending_trainers: trainerStats.unverified,
        total_reviews: reviewStats.total,
        pending_reviews: reviewStats.pending,
        total_featured: featuredStats.total,
        active_featured: featuredStats.active,
        queued_featured: featuredStats.queued,
        total_emergency_triage: emergencyStats.total_triage,
        medical_triage: emergencyStats.medical,
        crisis_triage: emergencyStats.crisis,
        total_payments: paymentStats.total_payments,
        total_revenue: paymentStats.total_revenue,
        recent_activity: recentActivity,
        pending_actions: pendingActions,
      };
    } catch (error) {
      logError(error, { method: 'getDashboardOverview' });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // TRAINER STATISTICS
  // ============================================================================

  /**
   * Get trainer statistics
   */
  async getTrainerStats(): Promise<TrainerStats> {
    try {
      // Get total counts
      const { data: trainers, error } = await this.supabase
        .from('business')
        .select('id, verified, claimed, council_id, resource_type, data_source, created_at')
        .is('deleted_at', null);

      if (error) throw error;

      const total = trainers?.length || 0;
      const verified = trainers?.filter((t) => t.verified).length || 0;
      const unverified = total - verified;
      const claimed = trainers?.filter((t) => t.claimed).length || 0;
      const unclaimed = total - claimed;

      // Get council names
      const councilIds = [...new Set(trainers?.map((t) => t.council_id) || [])];
      const { data: councils } = await this.supabase
        .from('council')
        .select('id, name')
        .in('id', councilIds);

      const councilMap = new Map(councils?.map((c) => [c.id, c.name]) || []);

      // Calculate by council
      const byCouncil = this.calculateCouncilStats(
        trainers || [],
        councilMap
      );

      // Calculate by resource type
      const byResourceType = this.calculateResourceTypeStats(trainers || []);

      // Calculate by data source
      const byDataSource = this.calculateDataSourceStats(trainers || []);

      // Calculate new trainers
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const newThisWeek = trainers?.filter((t) => new Date(t.created_at) >= weekAgo).length || 0;
      const newThisMonth = trainers?.filter((t) => new Date(t.created_at) >= monthAgo).length || 0;

      return {
        total,
        verified,
        unverified,
        claimed,
        unclaimed,
        by_council: byCouncil,
        by_resource_type: byResourceType,
        by_data_source: byDataSource,
        new_this_week: newThisWeek,
        new_this_month: newThisMonth,
      };
    } catch (error) {
      logError(error, { method: 'getTrainerStats' });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // REVIEW STATISTICS
  // ============================================================================

  /**
   * Get review statistics
   */
  async getReviewStats(): Promise<ReviewStats> {
    try {
      const { data: reviews, error } = await this.supabase
        .from('review')
        .select('id, rating, moderation_status, business_id, created_at');

      if (error) throw error;

      const total = reviews?.length || 0;
      const pending = reviews?.filter((r) => r.moderation_status === 'pending').length || 0;
      const approved = reviews?.filter((r) => r.moderation_status === 'approved').length || 0;
      const rejected = reviews?.filter((r) => r.moderation_status === 'rejected').length || 0;

      // Calculate average rating
      const averageRating =
        reviews && reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      // Calculate by rating
      const byRating = this.calculateRatingStats(reviews || []);

      // Get council names
      const businessIds = [...new Set(reviews?.map((r) => r.business_id) || [])];
      const { data: businesses } = await this.supabase
        .from('business')
        .select('id, council_id')
        .in('id', businessIds);

      const councilIds = [...new Set(businesses?.map((b) => b.council_id) || [])];
      const { data: councils } = await this.supabase
        .from('council')
        .select('id, name')
        .in('id', councilIds);

      const councilMap = new Map(councils?.map((c) => [c.id, c.name]) || []);
      const businessCouncilMap = new Map(businesses?.map((b) => [b.id, b.council_id]) || []);

      // Calculate by council
      const byCouncil = this.calculateReviewCouncilStats(
        reviews || [],
        businessCouncilMap,
        councilMap
      );

      // Calculate new reviews
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const newThisWeek = reviews?.filter((r) => new Date(r.created_at) >= weekAgo).length || 0;
      const newThisMonth = reviews?.filter((r) => new Date(r.created_at) >= monthAgo).length || 0;

      return {
        total,
        pending,
        approved,
        rejected,
        average_rating: Math.round(averageRating * 10) / 10,
        by_rating: byRating,
        by_council: byCouncil,
        new_this_week: newThisWeek,
        new_this_month: newThisMonth,
      };
    } catch (error) {
      logError(error, { method: 'getReviewStats' });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // PAYMENT STATISTICS
  // ============================================================================

  /**
   * Get payment statistics
   */
  async getPaymentStats(): Promise<PaymentStats> {
    try {
      const { data: featuredPlacements, error } = await this.supabase
        .from('featured_placement')
        .select('id, council_id, status, start_date, end_date');

      if (error) throw error;

      const total = featuredPlacements?.length || 0;
      const active = featuredPlacements?.filter((f) => f.status === 'active').length || 0;
      const queued = featuredPlacements?.filter((f) => f.status === 'queued').length || 0;
      const expired = featuredPlacements?.filter((f) => f.status === 'expired').length || 0;
      const refunded = featuredPlacements?.filter((f) => f.status === 'refunded').length || 0;
      const cancelled = featuredPlacements?.filter((f) => f.status === 'cancelled').length || 0;

      // Get council names
      const councilIds = [...new Set(featuredPlacements?.map((f) => f.council_id) || [])];
      const { data: councils } = await this.supabase
        .from('council')
        .select('id, name')
        .in('id', councilIds);

      const councilMap = new Map(councils?.map((c) => [c.id, c.name]) || []);

      // Calculate by council
      const byCouncil = this.calculateFeaturedCouncilStats(
        featuredPlacements || [],
        councilMap
      );

      // Calculate queue length
      const queueLength = queued;

      // Calculate average queue time (simplified)
      const averageQueueTime = 0; // TODO: Implement actual calculation

      // Calculate revenue this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const revenueThisMonth = active * 100; // TODO: Implement actual calculation

      return {
        total_payments: total,
        total_revenue: total * 100, // TODO: Implement actual calculation
        revenue_this_week: 0, // TODO: Implement actual calculation
        revenue_this_month: revenueThisMonth,
        average_transaction: 100, // TODO: Implement actual calculation
        by_council: byCouncil,
        successful_payments: active + expired,
        failed_payments: 0, // TODO: Implement actual calculation
        refund_count: refunded,
        refund_amount: refunded * 100, // TODO: Implement actual calculation
      };
    } catch (error) {
      logError(error, { method: 'getPaymentStats' });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // EMERGENCY TRIAGE STATISTICS
  // ============================================================================

  /**
   * Get emergency triage statistics
   */
  async getEmergencyStats(): Promise<EmergencyStats> {
    try {
      const { data: triageLogs, error } = await this.supabase
        .from('triage_log')
        .select('id, classification, confidence_score, ai_response, created_at');

      if (error) throw error;

      const total = triageLogs?.length || 0;
      const medical = triageLogs?.filter((t) => t.classification === 'medical').length || 0;
      const crisis = triageLogs?.filter((t) => t.classification === 'crisis').length || 0;
      const stray = triageLogs?.filter((t) => t.classification === 'stray').length || 0;
      const normal = triageLogs?.filter((t) => t.classification === 'normal').length || 0;

      // Calculate average confidence
      const averageConfidence =
        triageLogs && triageLogs.length > 0
          ? triageLogs.reduce((sum, t) => sum + t.confidence_score, 0) / triageLogs.length
          : 0;

      // Calculate AI response rate
      const aiResponseRate =
        triageLogs && triageLogs.length > 0
          ? triageLogs.filter((t) => t.ai_response !== null).length / triageLogs.length
          : 0;

      // Calculate new triage
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const newThisWeek = triageLogs?.filter((t) => new Date(t.created_at) >= weekAgo).length || 0;
      const newThisMonth = triageLogs?.filter((t) => new Date(t.created_at) >= monthAgo).length || 0;

      return {
        total_triage: total,
        medical,
        crisis,
        stray,
        normal,
        average_confidence: Math.round(averageConfidence * 100) / 100,
        by_council: [], // TODO: Implement council-based triage stats
        new_this_week: newThisWeek,
        new_this_month: newThisMonth,
        ai_response_rate: Math.round(aiResponseRate * 100) / 100,
      };
    } catch (error) {
      logError(error, { method: 'getEmergencyStats' });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // FEATURED PLACEMENT STATISTICS
  // ============================================================================

  /**
   * Get featured placement statistics
   */
  async getFeaturedStats(): Promise<FeaturedStats> {
    try {
      const { data: featuredPlacements, error } = await this.supabase
        .from('featured_placement')
        .select('id, council_id, status, start_date, end_date, queue_position');

      if (error) throw error;

      const total = featuredPlacements?.length || 0;
      const active = featuredPlacements?.filter((f) => f.status === 'active').length || 0;
      const queued = featuredPlacements?.filter((f) => f.status === 'queued').length || 0;
      const expired = featuredPlacements?.filter((f) => f.status === 'expired').length || 0;
      const refunded = featuredPlacements?.filter((f) => f.status === 'refunded').length || 0;
      const cancelled = featuredPlacements?.filter((f) => f.status === 'cancelled').length || 0;

      // Get council names
      const councilIds = [...new Set(featuredPlacements?.map((f) => f.council_id) || [])];
      const { data: councils } = await this.supabase
        .from('council')
        .select('id, name')
        .in('id', councilIds);

      const councilMap = new Map(councils?.map((c) => [c.id, c.name]) || []);

      // Calculate by council
      const byCouncil = this.calculateFeaturedCouncilStats(
        featuredPlacements || [],
        councilMap
      );

      // Calculate queue length
      const queueLength = queued;

      // Calculate average queue time
      const averageQueueTime = 0; // TODO: Implement actual calculation

      // Calculate revenue this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const revenueThisMonth = active * 100; // TODO: Implement actual calculation

      return {
        total,
        active,
        queued,
        expired,
        refunded,
        cancelled,
        by_council: byCouncil,
        queue_length: queueLength,
        average_queue_time: averageQueueTime,
        revenue_this_month: revenueThisMonth,
      };
    } catch (error) {
      logError(error, { method: 'getFeaturedStats' });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // RECENT ACTIVITY
  // ============================================================================

  /**
   * Get recent activity log
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
    try {
      // Get recent reviews
      const { data: recentReviews } = await this.supabase
        .from('review')
        .select('id, business_id, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Get recent featured placements
      const { data: recentFeatured } = await this.supabase
        .from('featured_placement')
        .select('id, business_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Get recent triage logs
      const { data: recentTriage } = await this.supabase
        .from('triage_log')
        .select('id, classification, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Combine and sort
      const activities: ActivityLog[] = [];

      recentReviews?.forEach((review) => {
        activities.push({
          id: review.id,
          type: 'review',
          action: 'New review submitted',
          description: 'A new review has been submitted',
          entity_id: review.id,
          entity_name: `Review ${review.id}`,
          user_id: null,
          created_at: new Date(review.created_at),
        });
      });

      recentFeatured?.forEach((featured) => {
        activities.push({
          id: featured.id,
          type: 'featured',
          action: `Featured placement ${featured.status}`,
          description: `Featured placement status changed to ${featured.status}`,
          entity_id: featured.id,
          entity_name: `Featured ${featured.id}`,
          user_id: null,
          created_at: new Date(featured.created_at),
        });
      });

      recentTriage?.forEach((triage) => {
        activities.push({
          id: triage.id,
          type: 'triage',
          action: `Emergency triage: ${triage.classification}`,
          description: `Emergency triage classified as ${triage.classification}`,
          entity_id: triage.id,
          entity_name: `Triage ${triage.id}`,
          user_id: null,
          created_at: new Date(triage.created_at),
        });
      });

      // Sort by date and limit
      activities.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

      return activities.slice(0, limit);
    } catch (error) {
      logError(error, { method: 'getRecentActivity' });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // PENDING ACTIONS
  // ============================================================================

  /**
   * Get pending actions
   */
  async getPendingActions(): Promise<PendingAction[]> {
    try {
      const actions: PendingAction[] = [];

      // Get pending reviews
      const { data: pendingReviews } = await this.supabase
        .from('review')
        .select('id, business_id, created_at')
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get business names
      const businessIds = [...new Set(pendingReviews?.map((r) => r.business_id) || [])];
      const { data: businesses } = await this.supabase
        .from('business')
        .select('id, name')
        .in('id', businessIds);

      const businessMap = new Map(businesses?.map((b) => [b.id, b.name]) || []);

      pendingReviews?.forEach((review) => {
        actions.push({
          id: review.id,
          type: 'review',
          priority: 'medium',
          title: 'Review pending moderation',
          description: `Review for ${businessMap.get(review.business_id) || 'Unknown'}`,
          entity_id: review.id,
          entity_name: businessMap.get(review.business_id) || 'Unknown',
          created_at: new Date(review.created_at),
        });
      });

      // Get unverified trainers
      const { data: unverifiedTrainers } = await this.supabase
        .from('business')
        .select('id, name, created_at')
        .eq('verified', false)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      unverifiedTrainers?.forEach((trainer) => {
        actions.push({
          id: trainer.id,
          type: 'trainer',
          priority: 'high',
          title: 'Trainer pending verification',
          description: `${trainer.name} needs verification`,
          entity_id: trainer.id,
          entity_name: trainer.name,
          created_at: new Date(trainer.created_at),
        });
      });

      // Get queued featured placements
      const { data: queuedFeatured } = await this.supabase
        .from('featured_placement')
        .select('id, business_id, queue_position, created_at')
        .eq('status', 'queued')
        .order('queue_position', { ascending: true })
        .limit(10);

      const featuredBusinessIds = [...new Set(queuedFeatured?.map((f) => f.business_id) || [])];
      const { data: featuredBusinesses } = await this.supabase
        .from('business')
        .select('id, name')
        .in('id', featuredBusinessIds);

      const featuredBusinessMap = new Map(featuredBusinesses?.map((b) => [b.id, b.name]) || []);

      queuedFeatured?.forEach((featured) => {
        actions.push({
          id: featured.id,
          type: 'featured_queue',
          priority: 'low',
          title: `Featured placement #${featured.queue_position} in queue`,
          description: `${featuredBusinessMap.get(featured.business_id) || 'Unknown'} is in queue`,
          entity_id: featured.id,
          entity_name: featuredBusinessMap.get(featured.business_id) || 'Unknown',
          created_at: new Date(featured.created_at),
        });
      });

      // Sort by priority and date
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      actions.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.created_at.getTime() - b.created_at.getTime();
      });

      return actions.slice(0, 20);
    } catch (error) {
      logError(error, { method: 'getPendingActions' });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate council statistics
   */
  private calculateCouncilStats(
    trainers: Business[],
    councilMap: Map<string, string>
  ): CouncilStats[] {
    const councilCounts = new Map<string, number>();

    trainers.forEach((trainer) => {
      const count = councilCounts.get(trainer.council_id) || 0;
      councilCounts.set(trainer.council_id, count + 1);
    });

    const total = trainers.length;
    const stats: CouncilStats[] = [];

    councilCounts.forEach((count, councilId) => {
      stats.push({
        council_id: councilId,
        council_name: councilMap.get(councilId) || 'Unknown',
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      });
    });

    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate resource type statistics
   */
  private calculateResourceTypeStats(trainers: Business[]): ResourceTypeStats[] {
    const typeCounts = new Map<string, number>();

    trainers.forEach((trainer) => {
      const count = typeCounts.get(trainer.resource_type) || 0;
      typeCounts.set(trainer.resource_type, count + 1);
    });

    const total = trainers.length;
    const stats: ResourceTypeStats[] = [];

    typeCounts.forEach((count, resourceType) => {
      stats.push({
        resource_type: resourceType,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      });
    });

    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate data source statistics
   */
  private calculateDataSourceStats(trainers: Business[]): DataSourceStats[] {
    const sourceCounts = new Map<string, number>();

    trainers.forEach((trainer) => {
      const count = sourceCounts.get(trainer.data_source) || 0;
      sourceCounts.set(trainer.data_source, count + 1);
    });

    const total = trainers.length;
    const stats: DataSourceStats[] = [];

    sourceCounts.forEach((count, dataSource) => {
      stats.push({
        data_source: dataSource,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      });
    });

    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate rating statistics
   */
  private calculateRatingStats(reviews: Review[]): RatingStats[] {
    const ratingCounts = new Map<number, number>();

    reviews.forEach((review) => {
      const count = ratingCounts.get(review.rating) || 0;
      ratingCounts.set(review.rating, count + 1);
    });

    const total = reviews.length;
    const stats: RatingStats[] = [];

    for (let rating = 1; rating <= 5; rating++) {
      const count = ratingCounts.get(rating) || 0;
      stats.push({
        rating,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      });
    }

    return stats;
  }

  /**
   * Calculate review council statistics
   */
  private calculateReviewCouncilStats(
    reviews: Review[],
    businessCouncilMap: Map<string, string>,
    councilMap: Map<string, string>
  ): CouncilStats[] {
    const councilCounts = new Map<string, number>();

    reviews.forEach((review) => {
      const councilId = businessCouncilMap.get(review.business_id);
      if (councilId) {
        const count = councilCounts.get(councilId) || 0;
        councilCounts.set(councilId, count + 1);
      }
    });

    const total = reviews.length;
    const stats: CouncilStats[] = [];

    councilCounts.forEach((count, councilId) => {
      stats.push({
        council_id: councilId,
        council_name: councilMap.get(councilId) || 'Unknown',
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      });
    });

    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate featured council statistics
   */
  private calculateFeaturedCouncilStats(
    featuredPlacements: FeaturedPlacement[],
    councilMap: Map<string, string>
  ): CouncilStats[] {
    const councilCounts = new Map<string, number>();

    featuredPlacements.forEach((featured) => {
      const count = councilCounts.get(featured.council_id) || 0;
      councilCounts.set(featured.council_id, count + 1);
    });

    const total = featuredPlacements.length;
    const stats: CouncilStats[] = [];

    councilCounts.forEach((count, councilId) => {
      stats.push({
        council_id: councilId,
        council_name: councilMap.get(councilId) || 'Unknown',
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      });
    });

    return stats.sort((a, b) => b.count - a.count);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default AdminDashboardService;
