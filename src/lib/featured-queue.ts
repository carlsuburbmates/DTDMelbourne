// ============================================================================
// DTD Phase 3: Monetisation - FIFO Queue Management
// File: src/lib/featured-queue.ts
// Description: FIFO queue management for featured placements
// ============================================================================

import { supabaseAdmin } from './auth';
import { logError } from './errors';
import type { FeaturedPlacement } from '../types/database';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Queue position result
 */
export interface QueuePositionResult {
  position: number | null;
  estimatedDays: number | null;
}

/**
 * Queue statistics
 */
export interface QueueStatistics {
  totalQueued: number;
  totalActive: number;
  councilBreakdown: Record<string, number>;
}

// ============================================================================
// QUEUE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Add trainer to featured queue
 */
export async function addToQueue(
  trainerId: string,
  councilId: string,
  stripePaymentId: string,
  durationDays: number
): Promise<FeaturedPlacement> {
  try {
    // Get current queue position for this council
    const { data: lastPosition, error: positionError } = await supabaseAdmin
      .from('featured_placements')
      .select('queue_position')
      .eq('council_id', councilId)
      .eq('status', 'queued')
      .order('queue_position', { ascending: false, nullsFirst: false })
      .limit(1)
      .single();

    const nextPosition = lastPosition?.queue_position
      ? lastPosition.queue_position + 1
      : 1;

    // Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    // Create featured placement with queued status
    const { data, error } = await supabaseAdmin
      .from('featured_placements')
      .insert({
        business_id: parseInt(trainerId, 10),
        council_id: parseInt(councilId, 10),
        stripe_payment_id: stripePaymentId,
        amount_cents: durationDays * 2000,
        currency: 'AUD',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'queued',
        tier: 'basic',
        queue_position: nextPosition,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to add trainer to queue');
    }

    return data;
  } catch (error) {
    logError(error, { context: 'addToQueue', trainerId, councilId });
    throw error;
  }
}

/**
 * Promote next trainer from queue to featured
 */
export async function promoteFromQueue(
  councilId: string
): Promise<FeaturedPlacement | null> {
  try {
    // Get next trainer in queue for this council
    const { data: nextPlacement, error: fetchError } = await supabaseAdmin
      .from('featured_placements')
      .select('*')
      .eq('council_id', councilId)
      .eq('status', 'queued')
      .order('queue_position', { ascending: true, nullsFirst: false })
      .limit(1)
      .single();

    if (fetchError || !nextPlacement) {
      return null;
    }

    // Update placement to active
    const { data, error: updateError } = await supabaseAdmin
      .from('featured_placements')
      .update({
        status: 'active',
        queue_activated_at: new Date().toISOString(),
      })
      .eq('id', nextPlacement.id)
      .select()
      .single();

    if (updateError || !data) {
      throw new Error('Failed to promote trainer from queue');
    }

    // Update queue positions for remaining trainers
    await updateQueuePositions(councilId);

    return data;
  } catch (error) {
    logError(error, { context: 'promoteFromQueue', councilId });
    throw error;
  }
}

/**
 * Get trainer's position in queue
 */
export async function getQueuePosition(
  trainerId: string
): Promise<QueuePositionResult> {
  try {
    // Get trainer's featured placement
    const { data: placement, error: placementError } = await supabaseAdmin
      .from('featured_placements')
      .select('*, council_id')
      .eq('business_id', trainerId)
      .eq('status', 'queued')
      .single();

    if (placementError || !placement) {
      return { position: null, estimatedDays: null };
    }

    // Get all active placements for this council
    const { data: activePlacements, error: activeError } = await supabaseAdmin
      .from('featured_placements')
      .select('end_date')
      .eq('council_id', placement.council_id)
      .eq('status', 'active')
      .order('end_date', { ascending: true });

    if (activeError) {
      throw new Error('Failed to get active placements');
    }

    // Calculate estimated days until activation
    let estimatedDays = 0;
    if (activePlacements && activePlacements.length > 0) {
      const lastActiveEnd = new Date(activePlacements[activePlacements.length - 1].end_date);
      const today = new Date();
      const diffTime = lastActiveEnd.getTime() - today.getTime();
      estimatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Add queue position offset
    if (placement.queue_position) {
      estimatedDays += (placement.queue_position - 1) * 7; // Assume 7 days per placement
    }

    return {
      position: placement.queue_position,
      estimatedDays: estimatedDays > 0 ? estimatedDays : 0,
    };
  } catch (error) {
    logError(error, { context: 'getQueuePosition', trainerId });
    throw error;
  }
}

/**
 * Get current queue length
 */
export async function getQueueLength(councilId?: string): Promise<number> {
  try {
    let query = supabaseAdmin
      .from('featured_placements')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'queued');

    if (councilId) {
      query = query.eq('council_id', councilId);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error('Failed to get queue length');
    }

    return count || 0;
  } catch (error) {
    logError(error, { context: 'getQueueLength', councilId });
    throw error;
  }
}

/**
 * Remove trainer from queue
 */
export async function removeFromQueue(
  trainerId: string,
  reason: string = 'Cancelled by user'
): Promise<boolean> {
  try {
    // Get trainer's featured placement
    const { data: placement, error: fetchError } = await supabaseAdmin
      .from('featured_placements')
      .select('*')
      .eq('business_id', trainerId)
      .eq('status', 'queued')
      .single();

    if (fetchError || !placement) {
      return false;
    }

    // Update placement to cancelled
    const { error: updateError } = await supabaseAdmin
      .from('featured_placements')
      .update({
        status: 'cancelled',
        refund_reason: reason,
      })
      .eq('id', placement.id);

    if (updateError) {
      throw new Error('Failed to remove trainer from queue');
    }

    // Update queue positions for remaining trainers
    if (placement.council_id && placement.queue_position) {
      await updateQueuePositions(placement.council_id.toString());
    }

    return true;
  } catch (error) {
    logError(error, { context: 'removeFromQueue', trainerId });
    throw error;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStatistics(
  councilId?: string
): Promise<QueueStatistics> {
  try {
    let query = supabaseAdmin
      .from('featured_placements')
      .select('council_id, status');

    if (councilId) {
      query = query.eq('council_id', councilId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Failed to get queue statistics');
    }

    const councilBreakdown: Record<string, number> = {};
    let totalQueued = 0;
    let totalActive = 0;

    if (data) {
      for (const placement of data) {
        const councilKey = placement.council_id.toString();

        if (placement.status === 'queued') {
          totalQueued++;
          councilBreakdown[councilKey] = (councilBreakdown[councilKey] || 0) + 1;
        } else if (placement.status === 'active') {
          totalActive++;
        }
      }
    }

    return {
      totalQueued,
      totalActive,
      councilBreakdown,
    };
  } catch (error) {
    logError(error, { context: 'getQueueStatistics', councilId });
    throw error;
  }
}

/**
 * Get all queued trainers for a council
 */
export async function getQueuedTrainers(
  councilId: string,
  limit: number = 10
): Promise<FeaturedPlacement[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('featured_placements')
      .select('*, businesses(*)')
      .eq('council_id', councilId)
      .eq('status', 'queued')
      .order('queue_position', { ascending: true, nullsFirst: false })
      .limit(limit);

    if (error) {
      throw new Error('Failed to get queued trainers');
    }

    return data || [];
  } catch (error) {
    logError(error, { context: 'getQueuedTrainers', councilId });
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Update queue positions after promotion or removal
 */
async function updateQueuePositions(councilId: string): Promise<void> {
  try {
    // Get all queued placements for this council
    const { data: placements, error: fetchError } = await supabaseAdmin
      .from('featured_placements')
      .select('id')
      .eq('council_id', councilId)
      .eq('status', 'queued')
      .order('queue_position', { ascending: true, nullsFirst: false });

    if (fetchError) {
      throw new Error('Failed to fetch queue positions');
    }

    // Update positions sequentially
    if (placements) {
      for (let i = 0; i < placements.length; i++) {
        await supabaseAdmin
          .from('featured_placements')
          .update({ queue_position: i + 1 })
          .eq('id', placements[i].id);
      }
    }
  } catch (error) {
    logError(error, { context: 'updateQueuePositions', councilId });
    throw error;
  }
}

/**
 * Check if trainer is in queue
 */
export async function isTrainerInQueue(
  trainerId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('featured_placements')
      .select('id')
      .eq('business_id', trainerId)
      .eq('status', 'queued')
      .single();

    if (error) {
      return false;
    }

    return !!data;
  } catch (error) {
    logError(error, { context: 'isTrainerInQueue', trainerId });
    return false;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export {
  addToQueue,
  promoteFromQueue,
  getQueuePosition,
  getQueueLength,
  removeFromQueue,
  getQueueStatistics,
  getQueuedTrainers,
  isTrainerInQueue,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. FIFO queue management for featured placements
// 2. Add trainer to queue with position calculation
// 3. Promote next trainer from queue to active
// 4. Get trainer's queue position and estimated wait time
// 5. Get queue length and statistics
// 6. Remove trainer from queue with position updates
// 7. Helper functions for queue position management
// 8. Based on DOCS/05_DATA_AND_API_CONTRACTS.md and D-013 requirement
// ============================================================================
