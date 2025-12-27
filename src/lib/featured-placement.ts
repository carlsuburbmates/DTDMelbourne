// ============================================================================
// DTD Phase 3: Monetisation - Featured Placement Management
// File: src/lib/featured-placement.ts
// Description: Featured placement management functions
// ============================================================================

import { supabaseAdmin } from './auth';
import { logError } from './errors';
import { promoteFromQueue } from './featured-queue';
import type { FeaturedPlacement } from '../types/database';

const FEATURED_DURATION_DAYS = 30;
const FEATURED_PRICE_CENTS = 1500;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Featured trainer result
 */
export interface FeaturedTrainerResult {
  businessId: string;
  businessName: string;
  councilId: string;
  councilName: string;
  startsAt: string;
  endsAt: string;
}

/**
 * Featured expiry result
 */
export interface FeaturedExpiryResult {
  expiredCount: number;
  promotedCount: number;
  errors: string[];
}

// ============================================================================
// FEATURED PLACEMENT MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Create featured placement
 */
export async function createFeaturedPlacement(
  trainerId: string,
  councilId: string,
  stripePaymentId: string
): Promise<FeaturedPlacement> {
  try {
    // Validate trainer exists
    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from('businesses')
      .select('id, name')
      .eq('id', trainerId)
      .single();

    if (trainerError || !trainer) {
      throw new Error('Trainer not found');
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + FEATURED_DURATION_DAYS);

    // Create featured placement
    const { data, error } = await supabaseAdmin
      .from('featured_placements')
      .insert({
        business_id: trainerId,
        council_id: councilId,
        stripe_payment_id: stripePaymentId,
        amount_cents: FEATURED_PRICE_CENTS,
        currency: 'AUD',
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        status: 'queued',
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to create featured placement');
    }

    return data;
  } catch (error) {
    logError(error, { context: 'createFeaturedPlacement', trainerId, councilId });
    throw error;
  }
}

/**
 * Extend featured placement
 */
export async function extendFeaturedPlacement(
  trainerId: string,
  stripePaymentId: string
): Promise<FeaturedPlacement> {
  try {
    // Get current active placement
    const { data: currentPlacement, error: fetchError } = await supabaseAdmin
      .from('featured_placements')
      .select('*')
      .eq('business_id', trainerId)
      .eq('status', 'active')
      .order('ends_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !currentPlacement) {
      throw new Error('No active featured placement found');
    }

    // Calculate new end date
    const currentEndDate = new Date(currentPlacement.ends_at);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + FEATURED_DURATION_DAYS);

    // Create new placement record for extension
    const { data, error } = await supabaseAdmin
      .from('featured_placements')
      .insert({
        business_id: trainerId,
        council_id: currentPlacement.council_id,
        stripe_payment_id: stripePaymentId,
        amount_cents: FEATURED_PRICE_CENTS,
        currency: 'AUD',
        starts_at: currentPlacement.ends_at,
        ends_at: newEndDate.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to extend featured placement');
    }

    return data;
  } catch (error) {
    logError(error, { context: 'extendFeaturedPlacement', trainerId });
    throw error;
  }
}

/**
 * Cancel featured placement
 */
export async function cancelFeaturedPlacement(
  trainerId: string,
  reason: string = 'Cancelled by user'
): Promise<boolean> {
  try {
    // Get active or queued placement
    const { data: placement, error: fetchError } = await supabaseAdmin
      .from('featured_placements')
      .select('*')
      .eq('business_id', trainerId)
      .in('status', ['active', 'queued'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !placement) {
      return false;
    }

    // Update placement to cancelled
    const { error: updateError } = await supabaseAdmin
      .from('featured_placements')
      .update({
        status: 'cancelled',
      })
      .eq('id', placement.id);

    if (updateError) {
      throw new Error('Failed to cancel featured placement');
    }

    // If placement was queued, update queue positions
    if (placement.status === 'queued' && placement.council_id) {
      const { removeFromQueue } = await import('./featured-queue');
      await removeFromQueue(trainerId, reason);
    }

    return true;
  } catch (error) {
    logError(error, { context: 'cancelFeaturedPlacement', trainerId });
    throw error;
  }
}

/**
 * Get all currently featured trainers
 */
export async function getFeaturedTrainers(
  councilId?: string
): Promise<FeaturedTrainerResult[]> {
  try {
    let query = supabaseAdmin
      .from('featured_placements')
      .select(`
        *,
        businesses!inner (
          id,
          name
        ),
        councils!inner (
          id,
          name
        )
      `)
      .eq('status', 'active')
      .gte('ends_at', new Date().toISOString())
      .order('ends_at', { ascending: true });

    if (councilId) {
      query = query.eq('council_id', councilId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Failed to get featured trainers');
    }

    return (data || []).map((placement) => ({
      businessId: placement.business_id.toString(),
      businessName: (placement.businesses as any)?.name || '',
      councilId: placement.council_id.toString(),
      councilName: (placement.councils as any)?.name || '',
      startsAt: placement.starts_at,
      endsAt: placement.ends_at,
    }));
  } catch (error) {
    logError(error, { context: 'getFeaturedTrainers', councilId });
    throw error;
  }
}

/**
 * Check and expire featured placements
 */
export async function checkFeaturedExpiry(): Promise<FeaturedExpiryResult> {
  const result: FeaturedExpiryResult = {
    expiredCount: 0,
    promotedCount: 0,
    errors: [],
  };

  try {
    const today = new Date().toISOString();

    // Get all expired active placements
    const { data: expiredPlacements, error: fetchError } = await supabaseAdmin
      .from('featured_placements')
      .select('*, council_id')
      .eq('status', 'active')
      .lt('ends_at', today);

    if (fetchError) {
      throw new Error('Failed to fetch expired placements');
    }

    if (!expiredPlacements || expiredPlacements.length === 0) {
      return result;
    }

    // Expire each placement
    for (const placement of expiredPlacements) {
      try {
        const { error: updateError } = await supabaseAdmin
          .from('featured_placements')
          .update({ status: 'expired' })
          .eq('id', placement.id);

        if (updateError) {
          result.errors.push(
            `Failed to expire placement ${placement.id}: ${updateError.message}`
          );
          continue;
        }

        result.expiredCount++;

        // Promote next trainer from queue for this council
        const promoted = await promoteFromQueue(
          placement.council_id.toString()
        );

        if (promoted) {
          result.promotedCount++;
        }
      } catch (error) {
        result.errors.push(
          `Error processing placement ${placement.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return result;
  } catch (error) {
    logError(error, { context: 'checkFeaturedExpiry' });
    throw error;
  }
}

/**
 * Get trainer's featured status
 */
export async function getTrainerFeaturedStatus(
  trainerId: string
): Promise<FeaturedPlacement | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('featured_placements')
      .select('*')
      .eq('business_id', trainerId)
      .in('status', ['active', 'queued'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    logError(error, { context: 'getTrainerFeaturedStatus', trainerId });
    throw error;
  }
}

/**
 * Get featured placement by ID
 */
export async function getFeaturedPlacementById(
  placementId: string
): Promise<FeaturedPlacement | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('featured_placements')
      .select('*')
      .eq('id', placementId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    logError(error, { context: 'getFeaturedPlacementById', placementId });
    throw error;
  }
}

/**
 * Get featured placements by council
 */
export async function getFeaturedPlacementsByCouncil(
  councilId: string,
  status?: 'active' | 'queued' | 'expired' | 'cancelled'
): Promise<FeaturedPlacement[]> {
  try {
    let query = supabaseAdmin
      .from('featured_placements')
      .select('*')
      .eq('council_id', councilId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Failed to get featured placements');
    }

    return data || [];
  } catch (error) {
    logError(error, { context: 'getFeaturedPlacementsByCouncil', councilId });
    throw error;
  }
}

/**
 * Check if trainer has active featured placement
 */
export async function hasActiveFeaturedPlacement(
  trainerId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('featured_placements')
      .select('id')
      .eq('business_id', trainerId)
      .eq('status', 'active')
      .gte('ends_at', new Date().toISOString().split('T')[0])
      .limit(1);

    if (error) {
      return false;
    }

    return !!data && data.length > 0;
  } catch (error) {
    logError(error, { context: 'hasActiveFeaturedPlacement', trainerId });
    return false;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export {
  createFeaturedPlacement,
  extendFeaturedPlacement,
  cancelFeaturedPlacement,
  getFeaturedTrainers,
  checkFeaturedExpiry,
  getTrainerFeaturedStatus,
  getFeaturedPlacementById,
  getFeaturedPlacementsByCouncil,
  hasActiveFeaturedPlacement,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Featured placement creation and management
// 2. Featured placement extension
// 3. Featured placement cancellation
// 4. Get all featured trainers with business and council details
// 5. Check and expire featured placements with queue promotion
// 6. Get trainer's featured status
// 7. Helper functions for featured placement queries
// 8. Based on DOCS/05_DATA_AND_API_CONTRACTS.md and D-013 requirement
// ============================================================================
