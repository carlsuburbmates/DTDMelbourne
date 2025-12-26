// ============================================================================
// DTD Phase 3: Monetisation - Featured Expiry Cron Job
// File: src/lib/cron/featured-expiry.ts
// Description: Cron job to check featured placement expiry
// ============================================================================

import { supabaseAdmin } from '../auth';
import { logError } from '../errors';
import { checkFeaturedExpiry } from '../featured-placement';
import type { CronJob } from '../../types/database';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CRON_JOB_NAME = 'featured_expiry_check';

// ============================================================================
// CRON JOB FUNCTIONS
// ============================================================================

/**
 * Run featured expiry check
 * This function should be called daily by a cron scheduler
 */
export async function runFeaturedExpiryCheck(): Promise<{
  success: boolean;
  result: {
    expiredCount: number;
    promotedCount: number;
    errors: string[];
  };
  cronJobId?: number;
}> {
  const startTime = new Date();
  let cronJobId: number | undefined;

  try {
    // Create cron job record
    const { data: cronJob, error: cronError } = await supabaseAdmin
      .from('cron_jobs')
      .insert({
        job_name: CRON_JOB_NAME,
        scheduled_run_time: startTime.toISOString(),
        status: 'running',
        started_at: startTime.toISOString(),
      })
      .select()
      .single();

    if (cronError || !cronJob) {
      throw new Error('Failed to create cron job record');
    }

    cronJobId = cronJob.id;

    // Run featured expiry check
    const result = await checkFeaturedExpiry();

    // Update cron job record with success
    const endTime = new Date();
    const { error: updateError } = await supabaseAdmin
      .from('cron_jobs')
      .update({
        status: 'completed',
        actual_run_time: endTime.toISOString(),
        completed_at: endTime.toISOString(),
        records_processed: result.expiredCount + result.promotedCount,
        error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
      })
      .eq('id', cronJob.id);

    if (updateError) {
      throw new Error('Failed to update cron job record');
    }

    return {
      success: true,
      result,
      cronJobId: cronJob.id,
    };
  } catch (error) {
    logError(error, { context: 'runFeaturedExpiryCheck' });

    // Update cron job record with failure
    if (cronJobId) {
      try {
        await supabaseAdmin
          .from('cron_jobs')
          .update({
            status: 'failed',
            actual_run_time: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', cronJobId);
      } catch (updateError) {
        logError(updateError, { context: 'updateFailedCronJob', cronJobId });
      }
    }

    return {
      success: false,
      result: {
        expiredCount: 0,
        promotedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      },
      cronJobId,
    };
  }
}

/**
 * Get cron job status
 */
export async function getCronJobStatus(): Promise<{
  lastRun: CronJob | null;
  lastSuccess: CronJob | null;
  lastFailure: CronJob | null;
}> {
  try {
    // Get last run
    const { data: lastRun, error: lastError } = await supabaseAdmin
      .from('cron_jobs')
      .select('*')
      .eq('job_name', CRON_JOB_NAME)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get last successful run
    const { data: lastSuccess, error: successError } = await supabaseAdmin
      .from('cron_jobs')
      .select('*')
      .eq('job_name', CRON_JOB_NAME)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get last failed run
    const { data: lastFailure, error: failureError } = await supabaseAdmin
      .from('cron_jobs')
      .select('*')
      .eq('job_name', CRON_JOB_NAME)
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      lastRun: lastRun || null,
      lastSuccess: lastSuccess || null,
      lastFailure: lastFailure || null,
    };
  } catch (error) {
    logError(error, { context: 'getCronJobStatus' });
    return {
      lastRun: null,
      lastSuccess: null,
      lastFailure: null,
    };
  }
}

/**
 * Get cron job history
 */
export async function getCronJobHistory(
  limit: number = 10
): Promise<CronJob[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('cron_jobs')
      .select('*')
      .eq('job_name', CRON_JOB_NAME)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error('Failed to get cron job history');
    }

    return data || [];
  } catch (error) {
    logError(error, { context: 'getCronJobHistory' });
    throw error;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export {
  runFeaturedExpiryCheck,
  getCronJobStatus,
  getCronJobHistory,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Cron job to check featured placement expiry daily
// 2. Update featured_placements table status for expired placements
// 3. Promote next trainer from FIFO queue if slot available
// 4. Cron job audit logging in cron_jobs table
// 5. Status tracking and error handling
// 6. Based on DOCS/05_DATA_AND_API_CONTRACTS.md and D-013 requirement
// ============================================================================
