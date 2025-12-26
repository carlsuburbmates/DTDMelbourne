// ============================================================================
// DTD Phase5: Operations - Health Monitoring Service
// File: src/lib/health-monitoring.ts
// Description: System health monitoring and alerting service
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import {
  DatabaseError,
  logError,
  handleSupabaseError,
} from './errors';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Service name
 */
export type ServiceName = 'database' | 'stripe' | 'zai' | 'supabase' | 'api';

/**
 * Health check result
 */
export interface HealthCheckResult {
  service: ServiceName;
  status: HealthStatus;
  latency_ms: number;
  message: string;
  last_checked: Date;
  details?: Record<string, unknown>;
}

/**
 * System health overview
 */
export interface SystemHealth {
  overall_status: HealthStatus;
  services: HealthCheckResult[];
  uptime_percentage: number;
  last_checked: Date;
  active_alerts: number;
}

/**
 * Health metrics
 */
export interface HealthMetrics {
  service: ServiceName;
  uptime_percentage: number;
  average_latency_ms: number;
  success_rate: number;
  total_checks: number;
  failed_checks: number;
  last_failure: Date | null;
  last_success: Date | null;
  period_start: Date;
  period_end: Date;
}

/**
 * Health alert
 */
export interface HealthAlert {
  id: string;
  service: ServiceName;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'resolved';
  title: string;
  message: string;
  details?: Record<string, unknown>;
  triggered_at: Date;
  resolved_at: Date | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create health alert input
 */
export interface CreateHealthAlertInput {
  service: ServiceName;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Health history entry
 */
export interface HealthHistory {
  id: string;
  service: ServiceName;
  status: HealthStatus;
  latency_ms: number;
  message: string;
  details?: Record<string, unknown>;
  checked_at: Date;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * Health monitoring service
 */
export class HealthMonitoringService {
  private supabase;
  private stripe: Stripe | null = null;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Stripe if API key is available
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey);
    }
  }

  // ============================================================================
  // SYSTEM HEALTH
  // ============================================================================

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const services = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkStripeHealth(),
        this.checkZaiHealth(),
        this.checkSupabaseHealth(),
      ]);

      // Calculate overall status
      const overallStatus = this.calculateOverallStatus(services);

      // Calculate uptime percentage
      const uptimePercentage = await this.calculateUptimePercentage();

      // Get active alerts count
      const { count } = await this.supabase
        .from('health_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      return {
        overall_status: overallStatus,
        services,
        uptime_percentage: uptimePercentage,
        last_checked: new Date(),
        active_alerts: count || 0,
      };
    } catch (error) {
      logError(error, { method: 'getSystemHealth' });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Get specific service health
   */
  async getServiceHealth(service: ServiceName): Promise<HealthCheckResult> {
    try {
      switch (service) {
        case 'database':
          return await this.checkDatabaseHealth();
        case 'stripe':
          return await this.checkStripeHealth();
        case 'zai':
          return await this.checkZaiHealth();
        case 'supabase':
          return await this.checkSupabaseHealth();
        case 'api':
          return await this.checkApiHealth();
        default:
          throw new Error(`Unknown service: ${service}`);
      }
    } catch (error) {
      logError(error, { method: 'getServiceHealth', service });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  /**
   * Check database health
   */
  async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Simple query to test database connection
      const { error } = await this.supabase
        .from('council')
        .select('id')
        .limit(1);

      const latency = Date.now() - startTime;

      if (error) {
        throw error;
      }

      const result: HealthCheckResult = {
        service: 'database',
        status: latency < 500 ? 'healthy' : 'degraded',
        latency_ms: latency,
        message: 'Database connection successful',
        last_checked: new Date(),
      };

      // Log health check
      await this.logHealthCheck(result);

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;

      const result: HealthCheckResult = {
        service: 'database',
        status: 'unhealthy',
        latency_ms: latency,
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        last_checked: new Date(),
        details: { error: String(error) },
      };

      // Log health check
      await this.logHealthCheck(result);

      // Create alert if critical
      await this.checkAndCreateAlert(result);

      return result;
    }
  }

  /**
   * Check Stripe health
   */
  async checkStripeHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!this.stripe) {
        const result: HealthCheckResult = {
          service: 'stripe',
          status: 'unknown',
          latency_ms: Date.now() - startTime,
          message: 'Stripe not configured',
          last_checked: new Date(),
        };

        await this.logHealthCheck(result);
        return result;
      }

      // Simple API call to test Stripe connection
      await this.stripe.balance.retrieve();

      const latency = Date.now() - startTime;

      const result: HealthCheckResult = {
        service: 'stripe',
        status: latency < 1000 ? 'healthy' : 'degraded',
        latency_ms: latency,
        message: 'Stripe API connection successful',
        last_checked: new Date(),
      };

      await this.logHealthCheck(result);
      return result;
    } catch (error) {
      const latency = Date.now() - startTime;

      const result: HealthCheckResult = {
        service: 'stripe',
        status: 'unhealthy',
        latency_ms: latency,
        message: `Stripe API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        last_checked: new Date(),
        details: { error: String(error) },
      };

      await this.logHealthCheck(result);
      await this.checkAndCreateAlert(result);

      return result;
    }
  }

  /**
   * Check Z.AI health
   */
  async checkZaiHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const zaiApiKey = process.env.ZAI_API_KEY;

      if (!zaiApiKey) {
        const result: HealthCheckResult = {
          service: 'zai',
          status: 'unknown',
          latency_ms: Date.now() - startTime,
          message: 'Z.AI not configured',
          last_checked: new Date(),
        };

        await this.logHealthCheck(result);
        return result;
      }

      // Simple API call to test Z.AI connection
      const response = await fetch('https://api.z.ai/v1/health', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${zaiApiKey}`,
        },
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: HealthCheckResult = {
        service: 'zai',
        status: latency < 2000 ? 'healthy' : 'degraded',
        latency_ms: latency,
        message: 'Z.AI API connection successful',
        last_checked: new Date(),
      };

      await this.logHealthCheck(result);
      return result;
    } catch (error) {
      const latency = Date.now() - startTime;

      const result: HealthCheckResult = {
        service: 'zai',
        status: 'unhealthy',
        latency_ms: latency,
        message: `Z.AI API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        last_checked: new Date(),
        details: { error: String(error) },
      };

      await this.logHealthCheck(result);
      await this.checkAndCreateAlert(result);

      return result;
    }
  }

  /**
   * Check Supabase health
   */
  async checkSupabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Check Supabase auth
      const { error } = await this.supabase.auth.getSession();

      const latency = Date.now() - startTime;

      if (error) {
        throw error;
      }

      const result: HealthCheckResult = {
        service: 'supabase',
        status: latency < 500 ? 'healthy' : 'degraded',
        latency_ms: latency,
        message: 'Supabase connection successful',
        last_checked: new Date(),
      };

      await this.logHealthCheck(result);
      return result;
    } catch (error) {
      const latency = Date.now() - startTime;

      const result: HealthCheckResult = {
        service: 'supabase',
        status: 'unhealthy',
        latency_ms: latency,
        message: `Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        last_checked: new Date(),
        details: { error: String(error) },
      };

      await this.logHealthCheck(result);
      await this.checkAndCreateAlert(result);

      return result;
    }
  }

  /**
   * Check API health
   */
  async checkApiHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const response = await fetch(`${apiUrl}/api/v1/health`, {
        method: 'GET',
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: HealthCheckResult = {
        service: 'api',
        status: latency < 500 ? 'healthy' : 'degraded',
        latency_ms: latency,
        message: 'API connection successful',
        last_checked: new Date(),
      };

      await this.logHealthCheck(result);
      return result;
    } catch (error) {
      const latency = Date.now() - startTime;

      const result: HealthCheckResult = {
        service: 'api',
        status: 'unhealthy',
        latency_ms: latency,
        message: `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        last_checked: new Date(),
        details: { error: String(error) },
      };

      await this.logHealthCheck(result);
      await this.checkAndCreateAlert(result);

      return result;
    }
  }

  // ============================================================================
  // HEALTH HISTORY
  // ============================================================================

  /**
   * Get health history
   */
  async getHealthHistory(
    service?: ServiceName,
    hours: number = 24
  ): Promise<HealthHistory[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      let query = this.supabase
        .from('health_history')
        .select('*')
        .gte('checked_at', since.toISOString())
        .order('checked_at', { ascending: false });

      if (service) {
        query = query.eq('service', service);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((entry) => this.mapHealthHistoryFromDb(entry));
    } catch (error) {
      logError(error, { method: 'getHealthHistory', service, hours });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // HEALTH METRICS
  // ============================================================================

  /**
   * Get health metrics
   */
  async getHealthMetrics(
    service: ServiceName,
    hours: number = 24
  ): Promise<HealthMetrics> {
    try {
      const history = await this.getHealthHistory(service, hours);

      const totalChecks = history.length;
      const failedChecks = history.filter((h) => h.status === 'unhealthy').length;
      const successChecks = totalChecks - failedChecks;

      const successRate = totalChecks > 0 ? (successChecks / totalChecks) * 100 : 0;
      const uptimePercentage = successRate;

      const averageLatency =
        totalChecks > 0
          ? history.reduce((sum, h) => sum + h.latency_ms, 0) / totalChecks
          : 0;

      const lastFailure =
        history.find((h) => h.status === 'unhealthy')?.checked_at || null;
      const lastSuccess =
        history.find((h) => h.status === 'healthy')?.checked_at || null;

      const periodEnd = new Date();
      const periodStart = new Date(Date.now() - hours * 60 * 60 * 1000);

      return {
        service,
        uptime_percentage: Math.round(uptimePercentage * 100) / 100,
        average_latency_ms: Math.round(averageLatency * 100) / 100,
        success_rate: Math.round(successRate * 100) / 100,
        total_checks: totalChecks,
        failed_checks: failedChecks,
        last_failure: lastFailure,
        last_success: lastSuccess,
        period_start: periodStart,
        period_end: periodEnd,
      };
    } catch (error) {
      logError(error, { method: 'getHealthMetrics', service, hours });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // HEALTH ALERTS
  // ============================================================================

  /**
   * Create health alert
   */
  async createHealthAlert(input: CreateHealthAlertInput): Promise<HealthAlert> {
    try {
      const now = new Date();

      const { data, error } = await this.supabase
        .from('health_alerts')
        .insert({
          service: input.service,
          severity: input.severity,
          status: 'active',
          title: input.title,
          message: input.message,
          details: input.details || null,
          triggered_at: now.toISOString(),
          resolved_at: null,
          resolved_by: null,
          resolution_notes: null,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapHealthAlertFromDb(data);
    } catch (error) {
      logError(error, { method: 'createHealthAlert', input });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Get health alerts
   */
  async getHealthAlerts(
    status?: 'active' | 'resolved' | 'all',
    service?: ServiceName
  ): Promise<HealthAlert[]> {
    try {
      let query = this.supabase
        .from('health_alerts')
        .select('*')
        .order('triggered_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (service) {
        query = query.eq('service', service);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((alert) => this.mapHealthAlertFromDb(alert));
    } catch (error) {
      logError(error, { method: 'getHealthAlerts', status, service });
      throw handleSupabaseError(error);
    }
  }

  /**
   * Resolve health alert
   */
  async resolveHealthAlert(
    alertId: string,
    resolvedBy: string,
    resolutionNotes: string
  ): Promise<HealthAlert> {
    try {
      const now = new Date();

      const { data, error } = await this.supabase
        .from('health_alerts')
        .update({
          status: 'resolved',
          resolved_at: now.toISOString(),
          resolved_by: resolvedBy,
          resolution_notes: resolutionNotes,
          updated_at: now.toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;

      return this.mapHealthAlertFromDb(data);
    } catch (error) {
      logError(error, { method: 'resolveHealthAlert', alertId, resolvedBy });
      throw handleSupabaseError(error);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate overall status from service health checks
   */
  private calculateOverallStatus(services: HealthCheckResult[]): HealthStatus {
    const unhealthyCount = services.filter((s) => s.status === 'unhealthy').length;
    const degradedCount = services.filter((s) => s.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    }

    if (degradedCount > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Calculate uptime percentage
   */
  private async calculateUptimePercentage(hours: number = 24): Promise<number> {
    try {
      const history = await this.getHealthHistory(undefined, hours);

      if (history.length === 0) {
        return 100;
      }

      const healthyCount = history.filter((h) => h.status === 'healthy').length;
      return (healthyCount / history.length) * 100;
    } catch (error) {
      logError(error, { method: 'calculateUptimePercentage' });
      return 0;
    }
  }

  /**
   * Log health check to database
   */
  private async logHealthCheck(result: HealthCheckResult): Promise<void> {
    try {
      await this.supabase.from('health_history').insert({
        service: result.service,
        status: result.status,
        latency_ms: result.latency_ms,
        message: result.message,
        details: result.details || null,
        checked_at: result.last_checked.toISOString(),
      });
    } catch (error) {
      logError(error, { method: 'logHealthCheck', result });
      // Don't throw - logging is secondary
    }
  }

  /**
   * Check and create alert if needed
   */
  private async checkAndCreateAlert(result: HealthCheckResult): Promise<void> {
    try {
      // Only create alert for unhealthy status
      if (result.status !== 'unhealthy') {
        return;
      }

      // Check if there's already an active alert for this service
      const { data: existingAlerts } = await this.supabase
        .from('health_alerts')
        .select('*')
        .eq('service', result.service)
        .eq('status', 'active')
        .order('triggered_at', { ascending: false })
        .limit(1);

      // Don't create duplicate alerts within 5 minutes
      if (existingAlerts && existingAlerts.length > 0) {
        const lastAlert = existingAlerts[0];
        const timeSinceLastAlert = Date.now() - new Date(lastAlert.triggered_at).getTime();

        if (timeSinceLastAlert < 5 * 60 * 1000) {
          return;
        }
      }

      // Create new alert
      await this.createHealthAlert({
        service: result.service,
        severity: 'critical',
        title: `${result.service.toUpperCase()} Service Unhealthy`,
        message: result.message,
        details: result.details,
      });
    } catch (error) {
      logError(error, { method: 'checkAndCreateAlert', result });
      // Don't throw - alerting is secondary
    }
  }

  /**
   * Map health alert from database
   */
  private mapHealthAlertFromDb(data: Record<string, unknown>): HealthAlert {
    return {
      id: data.id as string,
      service: data.service as ServiceName,
      severity: data.severity as 'critical' | 'warning' | 'info',
      status: data.status as 'active' | 'resolved',
      title: data.title as string,
      message: data.message as string,
      details: data.details as Record<string, unknown> | undefined,
      triggered_at: new Date(data.triggered_at as string),
      resolved_at: data.resolved_at ? new Date(data.resolved_at as string) : null,
      resolved_by: data.resolved_by as string | null,
      resolution_notes: data.resolution_notes as string | null,
      created_at: new Date(data.created_at as string),
      updated_at: new Date(data.updated_at as string),
    };
  }

  /**
   * Map health history from database
   */
  private mapHealthHistoryFromDb(data: Record<string, unknown>): HealthHistory {
    return {
      id: data.id as string,
      service: data.service as ServiceName,
      status: data.status as HealthStatus,
      latency_ms: data.latency_ms as number,
      message: data.message as string,
      details: data.details as Record<string, unknown> | undefined,
      checked_at: new Date(data.checked_at as string),
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default HealthMonitoringService;
