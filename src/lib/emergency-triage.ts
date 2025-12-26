// ============================================================================
// DTD Phase 4: Emergency Triage - Emergency Triage Service
// File: src/lib/emergency-triage.ts
// Description: Emergency triage service
// ============================================================================

import { supabase } from './auth';
import { handleSupabaseError, NotFoundError, BadRequestError } from './errors';
import { getCascadeManager } from './emergency-cascade';
import type { DogTriageClassification } from '../types/database';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Emergency triage request
 */
export interface EmergencyTriageRequest {
  user_message: string;
  dog_age_group?: string;
  behavior_issue?: string;
  location?: {
    council_id?: string;
    locality_id?: string;
  };
  ip_address?: string;
  user_agent?: string;
}

/**
 * Emergency triage response
 */
export interface EmergencyTriageResponse {
  id: string;
  user_message: string;
  classification: DogTriageClassification;
  confidence_score: number;
  ai_model_used: string;
  recommended_actions: string[];
  ai_response: string;
  created_at: Date;
}

/**
 * Emergency triage statistics
 */
export interface EmergencyTriageStatistics {
  total_triages: number;
  classification_counts: Record<string, number>;
  average_confidence: number;
  most_common_classification: string;
  triages_last_24h: number;
  triages_last_7d: number;
}

// ============================================================================
// EMERGENCY TRIAGE SERVICE CLASS
// ============================================================================

/**
 * Emergency triage service
 */
class EmergencyTriageService {
  /**
   * Submit emergency triage
   */
  async submitEmergencyTriage(data: EmergencyTriageRequest): Promise<EmergencyTriageResponse> {
    // Validate input
    if (!data.user_message || data.user_message.trim().length === 0) {
      throw new BadRequestError('User message is required');
    }

    // Use cascade to classify emergency
    const cascadeManager = getCascadeManager();
    const classificationResult = await cascadeManager.classifyEmergencyWithCascade(
      data.user_message,
      data.dog_age_group || 'Any age',
      data.behavior_issue || 'Other'
    );

    // Get recommendations
    const recommendationsResult = await cascadeManager.getRecommendationsWithCascade(
      classificationResult.classification
    );

    // Create triage log
    const { data: triageLog, error: triageError } = await supabase
      .from('triage_logs')
      .insert({
        owner_message: data.user_message,
        classification: classificationResult.classification,
        confidence_score: classificationResult.confidence_score,
        ai_model_used: classificationResult.provider,
        recommended_actions: recommendationsResult.recommendations,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
      })
      .select()
      .single();

    if (triageError) {
      throw handleSupabaseError(triageError);
    }

    return {
      id: triageLog.id,
      user_message: triageLog.owner_message,
      classification: triageLog.classification,
      confidence_score: triageLog.confidence_score || 0,
      ai_model_used: triageLog.ai_model_used || 'unknown',
      recommended_actions: triageLog.recommended_actions || [],
      ai_response: recommendationsResult.recommendations.join('\n'),
      created_at: new Date(triageLog.created_at),
    };
  }

  /**
   * Get emergency triage by ID
   */
  async getEmergencyTriage(id: string): Promise<EmergencyTriageResponse> {
    const { data: triageLog, error } = await supabase
      .from('triage_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (!triageLog) {
      throw new NotFoundError(`Emergency triage not found: ${id}`);
    }

    return {
      id: triageLog.id,
      user_message: triageLog.owner_message,
      classification: triageLog.classification,
      confidence_score: triageLog.confidence_score || 0,
      ai_model_used: triageLog.ai_model_used || 'unknown',
      recommended_actions: triageLog.recommended_actions || [],
      ai_response: triageLog.recommended_actions?.join('\n') || '',
      created_at: new Date(triageLog.created_at),
    };
  }

  /**
   * Get emergency triages by user (IP address)
   */
  async getEmergencyTriagesByUser(
    ipAddress: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<EmergencyTriageResponse[]> {
    const { data: triageLogs, error } = await supabase
      .from('triage_logs')
      .select('*')
      .eq('ip_address', ipAddress)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw handleSupabaseError(error);
    }

    return (triageLogs || []).map(log => ({
      id: log.id,
      user_message: log.owner_message,
      classification: log.classification,
      confidence_score: log.confidence_score || 0,
      ai_model_used: log.ai_model_used || 'unknown',
      recommended_actions: log.recommended_actions || [],
      ai_response: log.recommended_actions?.join('\n') || '',
      created_at: new Date(log.created_at),
    }));
  }

  /**
   * Update emergency triage
   */
  async updateEmergencyTriage(
    id: string,
    data: Partial<{
      action_taken: string;
      action_timestamp: Date;
    }>
  ): Promise<EmergencyTriageResponse> {
    const updateData: Record<string, unknown> = {};

    if (data.action_taken !== undefined) {
      updateData.action_taken = data.action_taken;
    }

    if (data.action_timestamp !== undefined) {
      updateData.action_timestamp = data.action_timestamp.toISOString();
    }

    const { data: triageLog, error } = await supabase
      .from('triage_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (!triageLog) {
      throw new NotFoundError(`Emergency triage not found: ${id}`);
    }

    return {
      id: triageLog.id,
      user_message: triageLog.owner_message,
      classification: triageLog.classification,
      confidence_score: triageLog.confidence_score || 0,
      ai_model_used: triageLog.ai_model_used || 'unknown',
      recommended_actions: triageLog.recommended_actions || [],
      ai_response: triageLog.recommended_actions?.join('\n') || '',
      created_at: new Date(triageLog.created_at),
    };
  }

  /**
   * Delete emergency triage
   */
  async deleteEmergencyTriage(id: string): Promise<void> {
    const { error } = await supabase
      .from('triage_logs')
      .delete()
      .eq('id', id);

    if (error) {
      throw handleSupabaseError(error);
    }
  }

  /**
   * Get emergency triage statistics
   */
  async getEmergencyTriageStatistics(): Promise<EmergencyTriageStatistics> {
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('triage_logs')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw handleSupabaseError(countError);
    }

    // Get classification counts
    const { data: classificationData, error: classificationError } = await supabase
      .from('triage_logs')
      .select('classification')
      .order('created_at', { ascending: false });

    if (classificationError) {
      throw handleSupabaseError(classificationError);
    }

    const classificationCounts: Record<string, number> = {};
    let totalConfidence = 0;

    (classificationData || []).forEach(log => {
      classificationCounts[log.classification] = (classificationCounts[log.classification] || 0) + 1;
      if (log.confidence_score) {
        totalConfidence += log.confidence_score;
      }
    });

    // Find most common classification
    let mostCommonClassification = 'normal';
    let maxCount = 0;

    Object.entries(classificationCounts).forEach(([classification, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonClassification = classification;
      }
    });

    // Get triages in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { count: last24hCount, error: last24hError } = await supabase
      .from('triage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo.toISOString());

    if (last24hError) {
      throw handleSupabaseError(last24hError);
    }

    // Get triages in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { count: last7dCount, error: last7dError } = await supabase
      .from('triage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    if (last7dError) {
      throw handleSupabaseError(last7dError);
    }

    return {
      total_triages: totalCount || 0,
      classification_counts: classificationCounts,
      average_confidence: totalCount > 0 ? totalConfidence / totalCount : 0,
      most_common_classification: mostCommonClassification,
      triages_last_24h: last24hCount || 0,
      triages_last_7d: last7dCount || 0,
    };
  }

  /**
   * Get emergency triages by classification
   */
  async getEmergencyTriagesByClassification(
    classification: DogTriageClassification,
    limit: number = 10,
    offset: number = 0
  ): Promise<EmergencyTriageResponse[]> {
    const { data: triageLogs, error } = await supabase
      .from('triage_logs')
      .select('*')
      .eq('classification', classification)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw handleSupabaseError(error);
    }

    return (triageLogs || []).map(log => ({
      id: log.id,
      user_message: log.owner_message,
      classification: log.classification,
      confidence_score: log.confidence_score || 0,
      ai_model_used: log.ai_model_used || 'unknown',
      recommended_actions: log.recommended_actions || [],
      ai_response: log.recommended_actions?.join('\n') || '',
      created_at: new Date(log.created_at),
    }));
  }

  /**
   * Get emergency triages by date range
   */
  async getEmergencyTriagesByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 100,
    offset: number = 0
  ): Promise<EmergencyTriageResponse[]> {
    const { data: triageLogs, error } = await supabase
      .from('triage_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw handleSupabaseError(error);
    }

    return (triageLogs || []).map(log => ({
      id: log.id,
      user_message: log.owner_message,
      classification: log.classification,
      confidence_score: log.confidence_score || 0,
      ai_model_used: log.ai_model_used || 'unknown',
      recommended_actions: log.recommended_actions || [],
      ai_response: log.recommended_actions?.join('\n') || '',
      created_at: new Date(log.created_at),
    }));
  }
}

// ============================================================================
// SERVICE INSTANCE
// ============================================================================

let emergencyTriageServiceInstance: EmergencyTriageService | null = null;

/**
 * Get or create emergency triage service instance
 */
export function getEmergencyTriageService(): EmergencyTriageService {
  if (!emergencyTriageServiceInstance) {
    emergencyTriageServiceInstance = new EmergencyTriageService();
  }
  return emergencyTriageServiceInstance;
}

/**
 * Reset emergency triage service instance (useful for testing)
 */
export function resetEmergencyTriageService(): void {
  emergencyTriageServiceInstance = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { EmergencyTriageService };
