// ============================================================================
// DTD Phase 4: Emergency Triage - Cascade Logic
// File: src/lib/emergency-cascade.ts
// Description: Cascade logic for AI providers (z.ai only with deterministic fallback)
// ============================================================================

import { getZaiClient, isZaiConfigured, type EmergencyClassification as ZaiClassification, type EmergencyRecommendation as ZaiRecommendation, type EmergencyContactInfo as ZaiContactInfo } from './zai';
import { AI_SERVICE_ERROR } from './errors';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Cascade event log
 */
export interface CascadeEvent {
  timestamp: string;
  operation: string;
  provider: 'zai' | 'none';
  success: boolean;
  error?: string;
  duration_ms: number;
}

/**
 * Cascade metrics
 */
export interface CascadeMetrics {
  total_requests: number;
  zai_success_count: number;
  zai_failure_count: number;
  total_failure_count: number;
  cascade_events: CascadeEvent[];
}

/**
 * Emergency classification result
 */
export interface EmergencyClassification {
  classification: 'medical' | 'crisis' | 'stray' | 'normal';
  reasoning: string;
  provider: 'zai';
}

/**
 * Emergency recommendation
 */
export interface EmergencyRecommendation {
  classification: string;
  recommendations: string[];
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  provider: 'zai';
}

/**
 * Emergency contact info
 */
export interface EmergencyContactInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  hours?: string;
  services?: string[];
  provider: 'zai';
}

// ============================================================================
// CASCADE MANAGER CLASS
// ============================================================================

/**
 * Cascade manager for AI providers
 */
class CascadeManager {
  private metrics: CascadeMetrics;
  private cascadeEnabled: boolean;

  constructor() {
    this.metrics = {
      total_requests: 0,
      zai_success_count: 0,
      zai_failure_count: 0,
      total_failure_count: 0,
      cascade_events: [],
    };
    this.cascadeEnabled = process.env.EMERGENCY_CASCADE_ENABLED === 'true';
  }

  /**
   * Log cascade event
   */
  private logEvent(event: CascadeEvent): void {
    this.metrics.cascade_events.push(event);
    this.metrics.total_requests++;

    if (event.provider === 'zai') {
      if (event.success) {
        this.metrics.zai_success_count++;
      } else {
        this.metrics.zai_failure_count++;
      }
    }

    if (!event.success) {
      this.metrics.total_failure_count++;
    }

    // Keep only last 100 events
    if (this.metrics.cascade_events.length > 100) {
      this.metrics.cascade_events.shift();
    }

    // Log to console for debugging
    console.log('[CASCADE]', JSON.stringify(event));
  }

  /**
   * Execute operation with cascade (z.ai only with deterministic fallback)
   */
  private async executeWithCascade<T>(
    operation: string,
    zaiOperation: () => Promise<T>
  ): Promise<T> {
    if (!this.cascadeEnabled) {
      throw new AI_SERVICE_ERROR('Emergency cascade disabled');
    }

    const startTime = Date.now();

    // Try Z.AI first
    if (isZaiConfigured()) {
      try {
        const result = await zaiOperation();
        this.logEvent({
          timestamp: new Date().toISOString(),
          operation,
          provider: 'zai',
          success: true,
          duration_ms: Date.now() - startTime,
        });
        return result;
      } catch (error) {
        this.logEvent({
          timestamp: new Date().toISOString(),
          operation,
          provider: 'zai',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration_ms: Date.now() - startTime,
        });
        throw new AI_SERVICE_ERROR('Z.AI failed - deterministic fallback required');
      }
    } else {
      throw new AI_SERVICE_ERROR('Z.AI not configured');
    }
  }

  /**
   * Classify emergency with cascade (z.ai only)
   */
  async classifyEmergencyWithCascade(
    description: string,
    dogAgeGroup: string,
    behaviorIssue: string
  ): Promise<EmergencyClassification> {
    const result = await this.executeWithCascade(
      'classify_emergency',
      async () => {
        const zaiResult = await getZaiClient().classifyEmergency(description, dogAgeGroup, behaviorIssue);
        return { ...zaiResult, provider: 'zai' as const };
      }
    );

    return result;
  }

  /**
   * Get recommendations with cascade (z.ai only)
   */
  async getRecommendationsWithCascade(classification: string): Promise<EmergencyRecommendation> {
    const result = await this.executeWithCascade(
      'get_recommendations',
      async () => {
        const zaiResult = await getZaiClient().getEmergencyRecommendations(classification);
        return { ...zaiResult, provider: 'zai' as const };
      }
    );

    return result;
  }

  /**
   * Get contacts with cascade (z.ai only)
   */
  async getContactsWithCascade(
    classification: string,
    councilId: string
  ): Promise<EmergencyContactInfo[]> {
    const result = await this.executeWithCascade(
      'get_contacts',
      async () => {
        const zaiResult = await getZaiClient().getEmergencyContacts(classification, councilId);
        return zaiResult.map(contact => ({ ...contact, provider: 'zai' as const }));
      }
    );

    return result;
  }

  /**
   * Get cascade metrics
   */
  getMetrics(): CascadeMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset cascade metrics
   */
  resetMetrics(): void {
    this.metrics = {
      total_requests: 0,
      zai_success_count: 0,
      zai_failure_count: 0,
      total_failure_count: 0,
      cascade_events: [],
    };
  }

  /**
   * Check if cascade is enabled
   */
  isCascadeEnabled(): boolean {
    return this.cascadeEnabled;
  }

  /**
   * Get cascade health status
   */
  async getHealthStatus(): Promise<{
    zai_available: boolean;
    cascade_enabled: boolean;
  }> {
    const zaiAvailable = isZaiConfigured() ? await getZaiClient().isAvailable() : false;

    return {
      zai_available: zaiAvailable,
      cascade_enabled: this.cascadeEnabled,
    };
  }
}

// ============================================================================
// CASCADE MANAGER INSTANCE
// ============================================================================

let cascadeManagerInstance: CascadeManager | null = null;

/**
 * Get or create cascade manager instance
 */
export function getCascadeManager(): CascadeManager {
  if (!cascadeManagerInstance) {
    cascadeManagerInstance = new CascadeManager();
  }
  return cascadeManagerInstance;
}

/**
 * Reset cascade manager instance (useful for testing)
 */
export function resetCascadeManager(): void {
  cascadeManagerInstance = null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if cascade is enabled
 */
export function isCascadeEnabled(): boolean {
  return process.env.EMERGENCY_CASCADE_ENABLED === 'true';
}

/**
 * Get cascade metrics
 */
export function getCascadeMetrics(): CascadeMetrics {
  return getCascadeManager().getMetrics();
}

/**
 * Reset cascade metrics
 */
export function resetCascadeMetrics(): void {
  getCascadeManager().resetMetrics();
}

/**
 * Get cascade health status
 */
export async getCascadeHealthStatus(): Promise<{
  zai_available: boolean;
  cascade_enabled: boolean;
}> {
  return getCascadeManager().getHealthStatus();
}

// ============================================================================
// EXPORTS
// ============================================================================

export { CascadeManager };
